import { PDFDocument } from 'pdf-lib'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { mkdir, writeFile } from 'node:fs/promises'
import { templates } from '../src/templates/index.ts'
import { buildExportHtml } from '../src/utils/documentExport.ts'

const API_URL = 'http://127.0.0.1:3001/api/convert/pdf'
const MARGINS = { top: 2.5, bottom: 2.5, left: 3, right: 1.5 }

async function exportFixture(editorHtml, filename) {
  const html = buildExportHtml({ html: editorHtml, margins: MARGINS })
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ html, filename }),
  })
  if (!response.ok) {
    throw new Error(`Export API returned ${response.status}: ${await response.text()}`)
  }
  return {
    bytes: new Uint8Array(await response.arrayBuffer()),
    controlledParagraphs: html.split('doc-paragraph').length - 1,
  }
}

async function inspectPdf(bytes) {
  const pdf = await PDFDocument.load(bytes)
  const parsedPdf = await getDocument({ data: bytes.slice(), disableWorker: true }).promise
  const pages = []
  for (let pageNumber = 1; pageNumber <= parsedPdf.numPages; pageNumber += 1) {
    const page = await parsedPdf.getPage(pageNumber)
    const content = await page.getTextContent()
    pages.push(content.items.filter((item) => 'str' in item && item.str.trim()))
  }
  return { pageCount: pdf.getPageCount(), pages }
}

function dominantBaselineGap(items) {
  const baselines = [...new Set(items.map((item) => Math.round(item.transform[5])))]
    .sort((a, b) => b - a)
  const gaps = baselines.slice(1).map((value, index) => baselines[index] - value)
    .filter((gap) => gap >= 15 && gap <= 30)
  const frequencies = new Map()
  for (const gap of gaps) frequencies.set(gap, (frequencies.get(gap) ?? 0) + 1)
  return [...frequencies].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0
}

const baseEditorHtml = templates.internalMemo.content.replace(/>\s+</g, '><')
const baseFixture = await exportFixture(baseEditorHtml, 'parity-base.pdf')
const basePdf = await inspectPdf(baseFixture.bytes)
const baselineGap = dominantBaselineGap(basePdf.pages[0])

console.log(`Base PDF pages: ${basePdf.pageCount}`)
console.log(`Paragraph baseline gap: ${baselineGap}pt`)
console.log(`Controlled paragraphs: ${baseFixture.controlledParagraphs}`)

if (basePdf.pageCount !== 1) {
  throw new Error(`Expected the internal memo fixture to fit on 1 page, got ${basePdf.pageCount}`)
}
if (Math.abs(baselineGap - 24) > 1) {
  throw new Error(`Expected a 24pt paragraph baseline gap, got ${baselineGap}pt`)
}

const boundaryEditorHtml = `${baseEditorHtml}<p data-page-break-before="true">&nbsp;</p><p>ssss</p>`
const boundaryFixture = await exportFixture(boundaryEditorHtml, 'parity-boundary.pdf')
const boundaryPdf = await inspectPdf(boundaryFixture.bytes)
const markerPage = boundaryPdf.pages.findIndex((items) =>
  items.some((item) => item.str.includes('ssss')),
) + 1

console.log(`Forced-break PDF pages: ${boundaryPdf.pageCount}`)
console.log(`Browser marker "ssss" page: ${markerPage}`)

if (markerPage !== 2) {
  throw new Error(`Expected marker "ssss" on page 2, got page ${markerPage || 'not found'}`)
}

await mkdir('../output/pdf', { recursive: true })
await writeFile('../output/pdf/browser-export-pagination-parity.pdf', boundaryFixture.bytes)
console.log('Saved: output/pdf/browser-export-pagination-parity.pdf')
