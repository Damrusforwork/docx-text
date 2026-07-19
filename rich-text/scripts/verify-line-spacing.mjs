import assert from 'node:assert/strict'
import { normalizeLineHeight } from '../src/extensions/lineHeight.ts'
import { DOCUMENT_PAGE_SPEC } from '../src/pageSpec.ts'
import { buildExportHtml } from '../src/utils/documentExport.ts'

const exported = buildExportHtml({
  html: '<p style="line-height: 1.25">กำหนดเอง</p><h2 style="line-height: 1.15">หัวข้อ</h2>',
  margins: DOCUMENT_PAGE_SPEC.defaultMargins,
})

assert.match(exported, /<div class="doc-paragraph" style="line-height: 1\.25">/)
assert.match(exported, /<h2 style="line-height: 1\.15">/)
assert.match(exported, /body \{[^}]*line-height: 24pt;/)
assert.equal(normalizeLineHeight(1.5), 1.5)
assert.equal(normalizeLineHeight(1.25), 1.25)
assert.equal(normalizeLineHeight('2'), 2)
assert.equal(normalizeLineHeight('1.25'), 1.25)
assert.equal(normalizeLineHeight(0.1), 0.1)
assert.equal(normalizeLineHeight(4), 4)
assert.equal(normalizeLineHeight('100'), 100)
assert.equal(normalizeLineHeight('24pt'), null)
assert.equal(normalizeLineHeight(''), null)
assert.equal(normalizeLineHeight(0), null)
assert.equal(normalizeLineHeight(-1), null)
assert.equal(normalizeLineHeight(Number.POSITIVE_INFINITY), null)

console.log('Line spacing export: passed')
