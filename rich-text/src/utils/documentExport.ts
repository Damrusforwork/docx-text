import { DOCUMENT_PAGE_SPEC, type DocumentMargins } from '../pageSpec.ts'

export type { DocumentMargins } from '../pageSpec.ts'

interface BuildExportHtmlOptions {
  html: string
  margins: DocumentMargins
}

function normalizeWhitespace(html: string): string {
  return html.replace(/ {2,}/g, (match) => '&nbsp;'.repeat(match.length))
}

function normalizeCssLengthsForLibreOffice(html: string): string {
  return html.replace(/(\d+(?:\.\d+)?)(pt|px)/gi, (_, value: string, unit: string) => {
    const numericValue = Number.parseFloat(value)
    const points = unit.toLowerCase() === 'pt' ? numericValue : numericValue * 0.75
    return `${Math.round(points * 100) / 100}pt`
  })
}

function normalizeParagraphsForLibreOffice(html: string): string {
  const pageBreakParagraphs: string[] = []
  const protectedHtml = html.replace(
    /<p([^>]*data-page-break-before=["']true["'][^>]*)>([\s\S]*?)<\/p>/gi,
    (paragraph) => {
      const token = `DOC_PAGE_BREAK_PARAGRAPH_${pageBreakParagraphs.length}`
      pageBreakParagraphs.push(paragraph)
      return token
    },
  )
  const emptyParagraph = /<p([^>]*)>\s*(?:(?:&nbsp;|&#160;|\u00a0)|<br\s*\/?>)?\s*<\/p>/gi
  const normalized = protectedHtml
    .replace(emptyParagraph, '<div class="doc-paragraph doc-empty"$1>&nbsp;</div>')
    .replace(/<p([^>]*)>/gi, '<div class="doc-paragraph"$1>')
    .replace(/<\/p>/gi, '</div>')
  return normalized.replace(/DOC_PAGE_BREAK_PARAGRAPH_(\d+)/g, (_, index: string) =>
    pageBreakParagraphs[Number.parseInt(index, 10)],
  )
}

function inlinePageBreakStyles(html: string): string {
  return html.replace(
    /<([a-z][\w-]*)([^>]*data-page-break-before=["']true["'][^>]*)>/gi,
    (tag, name: string, attributes: string) => {
      const breakStyle = 'page-break-before: always; break-before: page;'
      if (/\sstyle=["']/i.test(attributes)) {
        return `<${name}${attributes.replace(
          /\sstyle=(["'])(.*?)\1/i,
          (_, quote: string, styles: string) => ` style=${quote}${breakStyle} ${styles}${quote}`,
        )}>`
      }
      return `<${name}${attributes} style="${breakStyle}">`
    },
  )
}

export function buildExportHtml({
  html,
  margins,
}: BuildExportHtmlOptions): string {
  const { widthCm, heightCm, typography } = DOCUMENT_PAGE_SPEC
  const content = normalizeParagraphsForLibreOffice(
    inlinePageBreakStyles(normalizeWhitespace(normalizeCssLengthsForLibreOffice(html))),
  )
  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <style>
    @page { size: ${widthCm}cm ${heightCm}cm; margin: ${margins.top}cm ${margins.right}cm ${margins.bottom}cm ${margins.left}cm; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: #fff; }
    body { font-family: ${typography.fontFamily}; font-size: ${typography.fontSizePt}pt; line-height: ${typography.lineHeightPt}pt; color: #000; }
    .document-export { position: relative; white-space: pre-wrap; }
    [data-page-break-before="true"] { break-before: page; page-break-before: always; }
    p, .doc-paragraph { min-height: ${typography.lineHeightPt}pt; margin: 0 !important; padding: 0; font: inherit; line-height: ${typography.lineHeightPt}pt; }
    .doc-empty { height: ${typography.lineHeightPt}pt; min-height: ${typography.lineHeightPt}pt; overflow: hidden; }
    h1 { margin: 0 0 8pt; font-size: 24pt; line-height: 36pt; }
    h2 { margin: 0 0 8pt; font-size: 20pt; line-height: 30pt; }
    h3 { margin: 0 0 8pt; font-size: 18pt; line-height: 27pt; }
    ul, ol { margin: 8pt 0; padding-left: 32pt; }
    li { font-size: ${typography.fontSizePt}pt; line-height: ${typography.lineHeightPt}pt; }
    table { width: 100%; margin: 12pt 0; border-collapse: collapse; page-break-inside: avoid; }
    td, th { padding: 8pt 12pt; border: 1pt solid #000; font-size: 14pt; text-align: left; }
    th { background: #f0f0f0; font-weight: 600; }
    img { display: block; max-width: 100%; height: auto; margin: 8pt auto; }
    hr { margin: 16pt 0; border: 0; border-top: 1pt solid #ccc; }
  </style>
</head>
<body><div class="document-export">${content}</div></body>
</html>`
}
