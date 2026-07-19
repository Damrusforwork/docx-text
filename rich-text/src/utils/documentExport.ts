import { DOCUMENT_PAGE_SPEC, type DocumentMargins } from '../pageSpec.ts'
import type { CanonicalPagePlan } from '../layoutContract.ts'

export type { DocumentMargins } from '../pageSpec.ts'

interface BuildExportHtmlOptions {
  html: string
  margins: DocumentMargins
  pagePlan?: CanonicalPagePlan | null
}

function protectEmbeddedImages(html: string): {
  html: string
  restore: (value: string) => string
} {
  const images: string[] = []
  const protectedHtml = html.replace(
    /(\bsrc\s*=\s*["'])(data:image\/(?:png|jpe?g);base64,[^"']+)(["'])/gi,
    (_, prefix: string, image: string, suffix: string) => {
      const token = `DOC_EMBEDDED_IMAGE_${images.length}`
      images.push(image)
      return `${prefix}${token}${suffix}`
    },
  )

  return {
    html: protectedHtml,
    restore: (value) => value.replace(
      /DOC_EMBEDDED_IMAGE_(\d+)/g,
      (_, index: string) => images[Number.parseInt(index, 10)],
    ),
  }
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

function materializeBeforeBlockPageBreaks(html: string, pagePlan?: CanonicalPagePlan | null): string {
  if (!pagePlan?.breaks.length) return html
  const beforeBlockIds = new Set(
    pagePlan.breaks
      .filter((pageBreak) => pageBreak.position.kind === 'before-block')
      .map((pageBreak) => pageBreak.position.nodeId),
  )
  if (!beforeBlockIds.size) return html

  return html.replace(/<([a-z][\w-]*)([^>]*\sdata-layout-id=(["'])([^"']+)\3[^>]*)>/gi, (
    tag,
    name: string,
    attributes: string,
    _quote: string,
    layoutId: string,
  ) => {
    if (!beforeBlockIds.has(layoutId) || /\sdata-page-break-before=/i.test(attributes)) {
      return tag
    }
    return `<${name}${attributes} data-page-break-before="true">`
  })
}

export function buildExportHtml({
  html,
  margins,
  pagePlan,
}: BuildExportHtmlOptions): string {
  const { widthCm, heightCm, typography } = DOCUMENT_PAGE_SPEC
  const embeddedImages = protectEmbeddedImages(html)
  const content = embeddedImages.restore(
    normalizeParagraphsForLibreOffice(
      inlinePageBreakStyles(
        normalizeWhitespace(normalizeCssLengthsForLibreOffice(
          materializeBeforeBlockPageBreaks(embeddedImages.html, pagePlan),
        )),
      ),
    ),
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
    .image-export { margin: 8pt 0; text-align: center; }
    .image-export img { display: inline-block; margin: 0; }
    hr { margin: 16pt 0; border: 0; border-top: 1pt solid #ccc; }
  </style>
</head>
<body><div class="document-export">${content}</div></body>
</html>`
}
