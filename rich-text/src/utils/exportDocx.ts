const API_BASE = 'http://localhost:3001/api'

interface SignatureExport {
  dataUrl: string
  signerName: string
  position: { x: number; y: number }
  size: { width: number; height: number }
}

interface ExportDocxOptions {
  html: string
  filename?: string
  signatures?: SignatureExport[]
  pageElement?: HTMLElement | null
  margins?: { top: number; bottom: number; left: number; right: number }
}

function normalizeWhitespace(html: string): string {
  return html.replace(/ {2,}/g, (match) => '&nbsp;'.repeat(match.length))
}

function pxToPt(html: string): string {
  return html.replace(/font-size:\s*(\d+(?:\.\d+)?)px/gi, (_, px) => {
    const pt = Math.round(parseFloat(px) * 1)
    return `font-size: ${pt}pt`
  })
}

function extractFontFamily(html: string): string {
  const match = html.match(/font-family:\s*([^;"]+)/i)
  if (match) return match[1].trim()
  return '"TH Sarabun New", sans-serif'
}

function buildFullHtml(
  html: string,
  pageElement: HTMLElement | null,
  signatures: SignatureExport[],
  margins: { top: number; bottom: number; left: number; right: number },
): string {
  let styles = ''
  const fontFamily = extractFontFamily(html)

  const marginTop = margins.top
  const marginBottom = margins.bottom
  const marginLeft = margins.left
  const marginRight = margins.right

  styles = `
    <style>
      @page {
        size: A4;
        margin: ${marginTop}cm ${marginRight}cm ${marginBottom}cm ${marginLeft}cm;
      }
      body {
        font-family: ${fontFamily};
        font-size: 16pt;
        line-height: 1.5;
        color: #000;
        margin: 0;
        padding: 0;
        background: #fff;
      }
      table { border-collapse: collapse; width: 100%; }
      td, th { border: 1px solid #000; padding: 8px 12px; }
      th { background-color: #f0f0f0; }
      img { max-width: 100%; height: auto; }
      p, h1, h2, h3 { page-break-inside: avoid; }
    </style>`

  html = pxToPt(html)
  html = normalizeWhitespace(html)

  let signatureLayer = ''
  if (signatures.length > 0) {
    const imgs = signatures
      .map(
        (s) => `
      <div style="position:absolute;left:${s.position.x}px;top:${s.position.y}px;width:${s.size.width}px;height:${s.size.height}px;">
        <img src="${s.dataUrl}" alt="${s.signerName}" style="width:100%;height:100%;object-fit:contain;display:block;" />
      </div>`,
      )
      .join('')

    signatureLayer = `
      <div style="position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:9999;">
        ${imgs}
      </div>`
  }

  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8" />
  ${styles}
</head>
<body>
  <div style="position:relative;">
    ${html}
    ${signatureLayer}
  </div>
</body>
</html>`
}

export async function exportToDocx({
  html,
  filename = 'document.docx',
  signatures = [],
  pageElement = null,
  margins = { top: 2.54, bottom: 2.54, left: 3.175, right: 2.54 },
}: ExportDocxOptions) {
  const fullHtml = buildFullHtml(html, pageElement, signatures, margins)

  const response = await fetch(`${API_BASE}/convert/docx`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ html: fullHtml, filename }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`DOCX conversion failed: ${response.status} ${text}`)
  }

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
