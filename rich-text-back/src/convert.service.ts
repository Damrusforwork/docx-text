import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { execFile } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

const execFileAsync = promisify(execFile)

const FONTS_DIR = path.join(__dirname, '..', '..', 'fonts')

@Injectable()
export class ConvertService implements OnModuleInit {
  private readonly logger = new Logger(ConvertService.name)
  private fontsInstalled = false

  async onModuleInit() {
    this.installFontsToSystem()
  }

  private installFontsToSystem() {
    if (this.fontsInstalled) return
    if (!fs.existsSync(FONTS_DIR)) {
      this.logger.warn(`Fonts directory not found: ${FONTS_DIR}`)
      return
    }

    if (process.platform === 'win32') {
      this.installFontsWindows()
    } else {
      this.installFontsLinux()
    }

    this.fontsInstalled = true
  }

  private installFontsWindows() {
    const localFontsDir = path.join(
      process.env.LOCALAPPDATA || '',
      'Microsoft',
      'Windows',
      'Fonts',
    )
    fs.mkdirSync(localFontsDir, { recursive: true })

    const families = fs.readdirSync(FONTS_DIR)
    for (const family of families) {
      const familyDir = path.join(FONTS_DIR, family)
      if (!fs.statSync(familyDir).isDirectory()) continue

      const files = fs.readdirSync(familyDir)
      for (const file of files) {
        if (!file.toLowerCase().endsWith('.ttf')) continue

        const src = path.join(familyDir, file)
        const dest = path.join(localFontsDir, file)

        if (!fs.existsSync(dest)) {
          fs.copyFileSync(src, dest)
        }

        const fontName = file.replace(/\.ttf$/i, '').trim()
        this.registerFontWindows(fontName, file)
      }
    }
    this.logger.log('Fonts installed to Windows user profile')
  }

  private registerFontWindows(fontName: string, fileName: string) {
    try {
      const regCmd = `reg add "HKCU\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Fonts" /v "${fontName} (TrueType)" /t REG_SZ /d "${fileName}" /f`
      require('child_process').execSync(regCmd, { stdio: 'ignore' })
    } catch {}
  }

  private installFontsLinux() {
    const userFontDir = path.join(
      process.env.HOME || '/tmp',
      '.local',
      'share',
      'fonts',
    )
    fs.mkdirSync(userFontDir, { recursive: true })

    const families = fs.readdirSync(FONTS_DIR)
    for (const family of families) {
      const familyDir = path.join(FONTS_DIR, family)
      if (!fs.statSync(familyDir).isDirectory()) continue

      const files = fs.readdirSync(familyDir)
      for (const file of files) {
        if (!file.toLowerCase().endsWith('.ttf')) continue
        const dest = path.join(userFontDir, file)
        if (!fs.existsSync(dest)) {
          fs.copyFileSync(path.join(familyDir, file), dest)
        }
      }
    }

    try {
      require('child_process').execSync('fc-cache -f', { stdio: 'ignore' })
    } catch {}
    this.logger.log('Fonts installed to Linux user profile')
  }

  async convertHtmlToPdf(html: string): Promise<Buffer> {
    this.installFontsToSystem()

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'docx-convert-'))
    const inputPath = path.join(tmpDir, 'input.html')
    const outputDir = path.join(tmpDir, 'output')

    fs.mkdirSync(outputDir, { recursive: true })

    const styledHtml = this.wrapHtmlWithStyles(html)
    fs.writeFileSync(inputPath, styledHtml, 'utf-8')

    try {
      const env = this.buildLibreOfficeEnv(tmpDir)
      await this.runLibreOffice(inputPath, outputDir, 'pdf', env)
      const pdfFiles = fs.readdirSync(outputDir).filter((f) => f.endsWith('.pdf'))
      if (pdfFiles.length === 0) {
        throw new Error('LibreOffice did not produce a PDF file')
      }
      const pdfPath = path.join(outputDir, pdfFiles[0])
      return fs.readFileSync(pdfPath)
    } finally {
      this.cleanupDir(tmpDir)
    }
  }

  async convertHtmlToDocx(html: string): Promise<Buffer> {
    this.installFontsToSystem()

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'docx-convert-'))
    const inputPath = path.join(tmpDir, 'input.html')
    const outputDir = path.join(tmpDir, 'output')

    fs.mkdirSync(outputDir, { recursive: true })

    const styledHtml = this.wrapHtmlWithStyles(html)
    fs.writeFileSync(inputPath, styledHtml, 'utf-8')

    try {
      const env = this.buildLibreOfficeEnv(tmpDir)

      await this.runLibreOffice(inputPath, outputDir, 'odt', env)
      const odtFiles = fs.readdirSync(outputDir).filter((f) => f.endsWith('.odt'))
      if (odtFiles.length === 0) {
        throw new Error('LibreOffice did not produce an ODT file')
      }

      const odtPath = path.join(outputDir, odtFiles[0])
      await this.runLibreOffice(odtPath, outputDir, 'docx', env)

      const docxFiles = fs.readdirSync(outputDir).filter((f) => f.endsWith('.docx'))
      if (docxFiles.length === 0) {
        throw new Error('LibreOffice did not produce a DOCX file')
      }
      const docxPath = path.join(outputDir, docxFiles[0])
      return fs.readFileSync(docxPath)
    } finally {
      this.cleanupDir(tmpDir)
    }
  }

  private buildLibreOfficeEnv(tmpDir: string): Record<string, string> {
    const env = { ...process.env }

    if (process.platform !== 'win32') {
      const fontconfigDir = path.join(tmpDir, 'fontconfig')
      fs.mkdirSync(fontconfigDir, { recursive: true })
      this.createFontconfigConf(fontconfigDir)
      env.FONTCONFIG_FILE = path.join(fontconfigDir, 'fontconfig.conf')
    }

    return env
  }

  private createFontconfigConf(fontconfigDir: string) {
    const fontDirs = this.getFontDirs()
    const dirEntries = fontDirs
      .map((d) => `  <dir>${d}</dir>`)
      .join('\n')

    const conf = `<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd">
<fontconfig>
${dirEntries}
</fontconfig>`

    fs.writeFileSync(path.join(fontconfigDir, 'fontconfig.conf'), conf, 'utf-8')
  }

  private getFontDirs(): string[] {
    const dirs: string[] = []
    if (fs.existsSync(FONTS_DIR)) {
      const families = fs.readdirSync(FONTS_DIR)
      for (const family of families) {
        const familyDir = path.join(FONTS_DIR, family)
        if (fs.statSync(familyDir).isDirectory()) {
          dirs.push(familyDir)
        }
      }
    }
    return dirs
  }

  private wrapHtmlWithStyles(html: string): string {
    if (html.trim().startsWith('<html') || html.trim().startsWith('<!DOCTYPE')) {
      return html
    }
    return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'TH Sarabun IT๙', 'TH Sarabun New', 'TH Sarabun', sans-serif;
      font-size: 16px;
      line-height: 1.6;
      color: #000;
      margin: 0;
      padding: 20px;
    }
    table {
      border-collapse: collapse;
      width: 100%;
    }
    td, th {
      border: 1px solid #000;
      padding: 8px 12px;
    }
    th {
      background-color: #f0f0f0;
    }
    img {
      max-width: 100%;
      height: auto;
    }
    h1, h2, h3 {
      margin-top: 0.5em;
      margin-bottom: 0.5em;
    }
    p {
      margin: 0.3em 0;
    }
  </style>
</head>
<body>
${html}
</body>
</html>`
  }

  private async runLibreOffice(
    inputPath: string,
    outputDir: string,
    format: string,
    env: Record<string, string>,
  ): Promise<void> {
    const soffice = this.findLibreOffice()
    this.logger.log(`Running: ${soffice} --headless --convert-to ${format} --outdir ${outputDir} ${inputPath}`)

    try {
      const { stdout, stderr } = await execFileAsync(soffice, [
        '--headless',
        '--convert-to',
        format,
        '--outdir',
        outputDir,
        inputPath,
      ], { timeout: 60000, env })
      this.logger.log(`LibreOffice stdout: ${stdout}`)
      if (stderr) this.logger.warn(`LibreOffice stderr: ${stderr}`)
    } catch (err: any) {
      this.logger.error(`LibreOffice error: ${err.message}`)
      throw new Error(`LibreOffice conversion failed: ${err.message}`)
    }
  }

  private findLibreOffice(): string {
    if (process.platform === 'win32') {
      const candidates = [
        'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
        'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
      ]
      for (const p of candidates) {
        if (fs.existsSync(p)) return p
      }
      return 'soffice'
    }
    const candidates = [
      '/usr/bin/soffice',
      '/usr/bin/libreoffice',
      '/usr/local/bin/soffice',
      '/snap/bin/libreoffice',
    ]
    for (const p of candidates) {
      if (fs.existsSync(p)) return p
    }
    return 'soffice'
  }

  private cleanupDir(dir: string) {
    try {
      fs.rmSync(dir, { recursive: true, force: true })
    } catch {}
  }
}
