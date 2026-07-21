import assert from 'node:assert/strict'
import { normalizeParagraphMargin } from '../src/extensions/paragraphMargin.ts'
import { DOCUMENT_PAGE_SPEC } from '../src/pageSpec.ts'
import { buildExportHtml } from '../src/utils/documentExport.ts'

const exported = buildExportHtml({
  html: '<p style="text-align: center; margin-left: 50%;">(นายสมชาย ใจดี)</p>',
  margins: DOCUMENT_PAGE_SPEC.defaultMargins,
})

assert.match(exported, /<div class="doc-paragraph" style="text-align: center; margin-left: 8\.25cm;">/)
assert.doesNotMatch(exported, /margin-left: 50%/)
assert.doesNotMatch(exported, /margin: 0 !important/)
assert.equal(normalizeParagraphMargin('50%'), '50%')
assert.equal(normalizeParagraphMargin(' 50.0% '), '50%')
assert.equal(normalizeParagraphMargin('101%'), null)
assert.equal(normalizeParagraphMargin('50%; color: red'), null)

console.log('Signature layout export: passed')
