import assert from 'node:assert/strict'
import { DOCUMENT_PAGE_SPEC } from '../src/pageSpec.ts'
import { buildExportHtml } from '../src/utils/documentExport.ts'

const defaultTable = buildExportHtml({
  html: '<table style="min-width: 50px"><colgroup><col style="min-width: 25px"><col style="min-width: 25px"></colgroup><tbody><tr><td>A</td><td>B</td></tr></tbody></table>',
  margins: DOCUMENT_PAGE_SPEC.defaultMargins,
})

assert.match(defaultTable, /<table[^>]*style="[^"]*table-layout:\s*fixed/i)
assert.match(defaultTable, /<table[^>]*style="[^"]*width:\s*100%/i)
assert.match(defaultTable, /<table[^>]*width="100%"/i)
assert.match(defaultTable, /<td[^>]*style="[^"]*border:\s*1pt solid #000/i)
assert.match(defaultTable, /<td[^>]*style="[^"]*padding:\s*8pt 12pt/i)

const measuredTable = buildExportHtml({
  html: '<table data-table-align="right" width="640" style="width: 640px; table-layout: fixed; margin-left: auto; margin-right: 0"><tbody><tr><td width="384" style="width: 384px">A</td><td width="256" style="width: 256px">B</td></tr></tbody></table>',
  margins: DOCUMENT_PAGE_SPEC.defaultMargins,
})

assert.match(measuredTable, /width:\s*480pt/i)
assert.match(measuredTable, /data-table-align="right"/i)
assert.match(measuredTable, /<td width="384" style="[^"]*width:\s*288pt/i)
assert.doesNotMatch(measuredTable, /<table[^>]*style="[^"]*width:\s*100%/i)

console.log('Table export verification passed')
