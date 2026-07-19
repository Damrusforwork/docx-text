import assert from 'node:assert/strict'
import { buildExportHtml } from '../src/utils/documentExport.ts'
import { DOCUMENT_PAGE_SPEC } from '../src/pageSpec.ts'

const pagePlan = {
  version: 1,
  documentRevision: 'doc-test',
  layoutFingerprint: 'layout-test',
  pageCount: 2,
  breaks: [
    { pageNumber: 2, source: 'automatic', position: { kind: 'before-block', nodeId: 'block-2' } },
    { pageNumber: 3, source: 'automatic', position: { kind: 'text-offset', nodeId: 'block-3', offset: 12 } },
  ],
}

const html = buildExportHtml({
  html: [
    '<p data-layout-id="block-1">first  paragraph</p>',
    '<p data-layout-id="block-2">second paragraph</p>',
    '<p data-layout-id="block-3">third paragraph</p>',
  ].join(''),
  margins: DOCUMENT_PAGE_SPEC.defaultMargins,
  pagePlan,
})

assert.match(html, /data-layout-id="block-1"/)
assert.match(html, /data-layout-id="block-2"[^>]*data-page-break-before="true"/)
assert.match(html, /data-layout-id="block-2"[^>]*page-break-before: always; break-before: page;/)
assert.doesNotMatch(html, /data-layout-id="block-3"[^>]*data-page-break-before="true"/)
assert.match(html, /first&nbsp;&nbsp;paragraph/)
assert.match(html, /second paragraph/)
assert.match(html, /third paragraph/)

const existingBreak = buildExportHtml({
  html: '<p data-layout-id="block-2" data-page-break-before="true">kept</p>',
  margins: DOCUMENT_PAGE_SPEC.defaultMargins,
  pagePlan,
})
assert.equal((existingBreak.match(/data-page-break-before=/g) ?? []).length, 2)
assert.match(existingBreak, /data-layout-id="block-2" data-page-break-before="true"/)

const legacyHtml = buildExportHtml({
  html: '<p data-layout-id="block-2">legacy</p>',
  margins: DOCUMENT_PAGE_SPEC.defaultMargins,
  pagePlan: null,
})
assert.doesNotMatch(legacyHtml, /data-layout-id="block-2"[^>]*data-page-break-before="true"/)

console.log('Export before-block materialization: passed')
