export interface SignatureExport {
  dataUrl: string
  signerName: string
  position: { x: number; y: number }
  size: { width: number; height: number }
}

export interface DocumentMargins {
  top: number
  bottom: number
  left: number
  right: number
}

interface BuildExportHtmlOptions {
  html: string
  signatures: SignatureExport[]
  margins: DocumentMargins
}

function normalizeWhitespace(html: string): string {
  return html.replace(/ {2,}/g, (match) => '&nbsp;'.repeat(match.length))
}

function normalizePixelFontSizes(html: string): string {
  return html.replace(/font-size:\s*(\d+(?:\.\d+)?)px/gi, (_, value: string) => {
    const points = Math.round(Number.parseFloat(value) * 0.75 * 100) / 100
    return `font-size: ${points}pt`
  })
}

function preserveEmptyParagraphs(html: string): string {
  return html.replace(
    /<p([^>]*)>\s*(?:<br\s*\/?>)?\s*<\/p>/gi,
    '<p$1>&nbsp;</p>',
  )
}

export function buildExportHtml({
  html,
  signatures,
  margins,
}: BuildExportHtmlOptions): string {
  const content = preserveEmptyParagraphs(normalizeWhitespace(normalizePixelFontSizes(html)))
  const signatureLayer = signatures.length
    ? `<div class="signature-export-layer">${signatures
        .map(
          (signature) =>
            `<div style="position:absolute;left:${signature.position.x}px;top:${signature.position.y}px;width:${signature.size.width}px;height:${signature.size.height}px"><img src="${signature.dataUrl}" alt="${signature.signerName}" style="width:100%;height:100%;object-fit:contain;display:block"></div>`,
        )
        .join('')}</div>`
    : ''

  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <style>
    @page { size: A4; margin: ${margins.top}cm ${margins.right}cm ${margins.bottom}cm ${margins.left}cm; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: #fff; }
    body { font-family: 'TH Sarabun New', sans-serif; font-size: 16pt; line-height: 1.5; color: #000; }
    .document-export { position: relative; white-space: pre-wrap; }
    p { min-height: 1.5em; margin: 0; font: inherit; line-height: inherit; }
    h1 { margin: 0 0 8pt; font-size: 24pt; line-height: 1.5; }
    h2 { margin: 0 0 8pt; font-size: 20pt; line-height: 1.5; }
    h3 { margin: 0 0 8pt; font-size: 18pt; line-height: 1.5; }
    ul, ol { margin: 8pt 0; padding-left: 32pt; }
    li { font-size: 16pt; line-height: 1.5; }
    table { width: 100%; margin: 12pt 0; border-collapse: collapse; page-break-inside: avoid; }
    td, th { padding: 8pt 12pt; border: 1pt solid #000; font-size: 14pt; text-align: left; }
    th { background: #f0f0f0; font-weight: 600; }
    img { display: block; max-width: 100%; height: auto; margin: 8pt auto; }
    hr { margin: 16pt 0; border: 0; border-top: 1pt solid #ccc; }
    .signature-export-layer { position: absolute; inset: 0; z-index: 9999; pointer-events: none; }
  </style>
</head>
<body><div class="document-export">${content}${signatureLayer}</div></body>
</html>`
}
