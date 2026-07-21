import { PDFDocument } from 'pdf-lib'
import { getDocument, OPS } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { mkdir, writeFile } from 'node:fs/promises'
import { DOCUMENT_PAGE_SPEC } from '../src/pageSpec.ts'
import { LAYOUT_TOLERANCE } from '../src/rendering/layoutTolerance.ts'
import { buildExportHtml } from '../src/utils/documentExport.ts'
import { GOLDEN_EXPORT_FIXTURES } from './fixtures/export-golden-fixtures.mjs'

try {
  process.loadEnvFile()
} catch (error) {
  if (error.code !== 'ENOENT') throw error
}

const API_URL = process.env.VERIFY_EXPORT_API_URL || 'http://127.0.0.1:3001/api/convert/pdf'

async function exportFixture(fixture) {
  const html = buildExportHtml({
    html: fixture.html.replace(/>\s+</g, '><'),
    margins: DOCUMENT_PAGE_SPEC.defaultMargins,
  })
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ html, filename: `${fixture.id}.pdf` }),
  })
  if (!response.ok) throw new Error(`Export API returned ${response.status}`)
  return new Uint8Array(await response.arrayBuffer())
}

function multiply(left, right) {
  const [a1, b1, c1, d1, e1, f1] = left
  const [a2, b2, c2, d2, e2, f2] = right
  return [
    a1 * a2 + c1 * b2,
    b1 * a2 + d1 * b2,
    a1 * c2 + c1 * d2,
    b1 * c2 + d1 * d2,
    a1 * e2 + c1 * f2 + e1,
    b1 * e2 + d1 * f2 + f1,
  ]
}

function boundsFromMatrix([a, b, c, d, e, f]) {
  const points = [[e, f], [a + e, b + f], [c + e, d + f], [a + c + e, b + d + f]]
  const xs = points.map(([x]) => x)
  const ys = points.map(([, y]) => y)
  return {
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys),
  }
}

async function imageBounds(page) {
  const operators = await page.getOperatorList()
  const stack = []
  let transform = [1, 0, 0, 1, 0, 0]
  const images = []
  for (let index = 0; index < operators.fnArray.length; index += 1) {
    const operation = operators.fnArray[index]
    if (operation === OPS.save) stack.push([...transform])
    else if (operation === OPS.restore) transform = stack.pop() || [1, 0, 0, 1, 0, 0]
    else if (operation === OPS.transform) transform = multiply(transform, operators.argsArray[index])
    else if ([OPS.paintImageXObject, OPS.paintJpegXObject, OPS.paintInlineImageXObject].includes(operation)) {
      images.push(boundsFromMatrix(transform))
    }
  }
  return images
}

async function inspectPdf(bytes) {
  const pdf = await PDFDocument.load(bytes)
  const parsed = await getDocument({ data: bytes.slice(), disableWorker: true }).promise
  const pages = []
  for (let pageNumber = 1; pageNumber <= parsed.numPages; pageNumber += 1) {
    const page = await parsed.getPage(pageNumber)
    const content = await page.getTextContent()
    pages.push({
      text: content.items.filter((item) => 'str' in item).map((item) => item.str).join(' '),
      items: content.items.filter((item) => 'str' in item && item.str.trim()),
      images: await imageBounds(page),
    })
  }
  await parsed.destroy()
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

function assertTextOrder(text, expected, fixtureId) {
  let offset = 0
  for (const token of expected) {
    const nextOffset = text.indexOf(token, offset)
    if (nextOffset < 0) throw new Error(`${fixtureId}: missing or out-of-order text "${token}"`)
    offset = nextOffset + token.length
  }
}

const report = []
await mkdir('../output/pdf/golden', { recursive: true })
const requestedFixture = process.argv[2]
const fixtures = requestedFixture
  ? GOLDEN_EXPORT_FIXTURES.filter((fixture) => fixture.id === requestedFixture)
  : GOLDEN_EXPORT_FIXTURES
if (requestedFixture && fixtures.length === 0) throw new Error(`Unknown fixture: ${requestedFixture}`)

for (const fixture of fixtures) {
  const bytes = await exportFixture(fixture)
  await writeFile(`../output/pdf/golden/${fixture.id}.pdf`, bytes)
  const pdf = await inspectPdf(bytes)
  const allText = pdf.pages.map((page) => page.text).join(' ')
  if (Math.abs(pdf.pageCount - fixture.expected.pageCount) > LAYOUT_TOLERANCE.pageCount) {
    throw new Error(`${fixture.id}: expected ${fixture.expected.pageCount} pages, got ${pdf.pageCount}`)
  }
  assertTextOrder(allText, fixture.expected.textOrder, fixture.id)

  if (fixture.expected.baselinePt) {
    const baseline = dominantBaselineGap(pdf.pages[0].items)
    if (Math.abs(baseline - fixture.expected.baselinePt) > LAYOUT_TOLERANCE.baselinePt) {
      throw new Error(`${fixture.id}: expected ${fixture.expected.baselinePt}pt baseline, got ${baseline}pt`)
    }
  }
  if (fixture.expected.imageBoundsPt) {
    const bounds = pdf.pages.flatMap((page) => page.images)[0]
    if (!bounds
      || Math.abs(bounds.width - fixture.expected.imageBoundsPt.width) > LAYOUT_TOLERANCE.imageBoundsPt
      || Math.abs(bounds.height - fixture.expected.imageBoundsPt.height) > LAYOUT_TOLERANCE.imageBoundsPt) {
      throw new Error(`${fixture.id}: image bounds outside tolerance`)
    }
  }
  if (fixture.expected.minimumHorizontalGapPt) {
    const { left, right, value } = fixture.expected.minimumHorizontalGapPt
    const leftItem = pdf.pages.flatMap((page) => page.items).find((item) => item.str.includes(left))
    const rightItem = pdf.pages.flatMap((page) => page.items).find((item) => item.str.includes(right))
    const gap = leftItem && rightItem ? Math.abs(rightItem.transform[4] - leftItem.transform[4]) : 0
    if (gap < value) {
      throw new Error(`${fixture.id}: expected at least ${value}pt between table columns, got ${gap}pt`)
    }
  }
  if (fixture.expected.minimumTextXPt) {
    const { text, value } = fixture.expected.minimumTextXPt
    const item = pdf.pages.flatMap((page) => page.items).find((candidate) => candidate.str.includes(text))
    const x = item?.transform[4] ?? 0
    if (x < value) throw new Error(`${fixture.id}: expected "${text}" at x >= ${value}pt, got ${x}pt`)
  }
  if (fixture.expected.marker) {
    const markerPage = pdf.pages.findIndex((page) => page.text.includes(fixture.expected.marker.text)) + 1
    if (markerPage !== fixture.expected.marker.page) {
      throw new Error(`${fixture.id}: marker rendered on page ${markerPage}`)
    }
  }

  report.push({ id: fixture.id, pageCount: pdf.pageCount, passed: true })
}

await writeFile('../output/pdf/golden/report.json', JSON.stringify({
  tolerance: LAYOUT_TOLERANCE,
  fixtures: report,
}, null, 2))
console.log(`Golden export fixtures: ${report.length} passed`)
