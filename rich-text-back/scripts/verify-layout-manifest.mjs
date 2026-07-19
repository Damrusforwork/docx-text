import assert from 'node:assert/strict'
import {
  LayoutPlanValidationError,
  MAX_LAYOUT_BREAKS,
  MAX_LAYOUT_MANIFEST_BYTES,
  createDocumentRevision,
  validateLayoutManifest,
} from '../src/layoutManifest.ts'

const document = {
  schemaVersion: 1,
  content: {
    type: 'doc',
    content: [
      { type: 'paragraph', attrs: { layoutId: 'block-1' }, content: [{ type: 'text', text: 'one' }] },
      { type: 'paragraph', attrs: { layoutId: 'block-2' }, content: [{ type: 'text', text: 'two' }] },
      { type: 'paragraph', attrs: { layoutId: 'block-3' }, content: [{ type: 'text', text: 'three' }] },
    ],
  },
}

function manifest(overrides = {}) {
  return {
    pageCount: 3,
    pagePlan: {
      version: 1,
      documentRevision: createDocumentRevision(document.content),
      layoutFingerprint: 'layout-test',
      pageCount: 3,
      breaks: [
        { pageNumber: 2, source: 'automatic', position: { kind: 'before-block', nodeId: 'block-2' } },
        { pageNumber: 3, source: 'automatic', position: { kind: 'text-offset', nodeId: 'block-3', offset: 2 } },
      ],
      ...overrides,
    },
  }
}

function assertCode(code, run) {
  assert.throws(
    run,
    (error) => error instanceof LayoutPlanValidationError && error.code === code,
  )
}

assert.doesNotThrow(() => validateLayoutManifest({ document, renderManifest: manifest() }))
assert.doesNotThrow(() => validateLayoutManifest({ renderManifest: { pageCount: 1 } }))
assert.doesNotThrow(() => validateLayoutManifest({ legacyLayout: true, renderManifest: 'legacy' }))

assertCode('LAYOUT_STALE', () => validateLayoutManifest({
  document,
  renderManifest: manifest({ documentRevision: 'doc-stale' }),
}))
assertCode('LAYOUT_PLAN_INVALID', () => validateLayoutManifest({
  document,
  renderManifest: manifest({ breaks: [
    { pageNumber: 2, source: 'automatic', position: { kind: 'before-block', nodeId: 'missing' } },
  ] }),
}))
assertCode('LAYOUT_PLAN_INVALID', () => validateLayoutManifest({
  document,
  renderManifest: manifest({ breaks: [
    { pageNumber: 3, source: 'automatic', position: { kind: 'before-block', nodeId: 'block-2' } },
    { pageNumber: 2, source: 'automatic', position: { kind: 'text-offset', nodeId: 'block-3', offset: 2 } },
  ] }),
}))
assertCode('LAYOUT_PLAN_INVALID', () => validateLayoutManifest({
  document,
  renderManifest: manifest({ breaks: [
    { pageNumber: 2, source: 'automatic', position: { kind: 'before-block', nodeId: 'block-2' } },
    { pageNumber: 3, source: 'manual', position: { kind: 'before-block', nodeId: 'block-2' } },
  ] }),
}))
assertCode('LAYOUT_PLAN_INVALID', () => validateLayoutManifest({
  document,
  renderManifest: manifest({
    pageCount: MAX_LAYOUT_BREAKS + 2,
    breaks: Array.from({ length: MAX_LAYOUT_BREAKS + 1 }, (_, index) => ({
      pageNumber: index + 2,
      source: 'automatic',
      position: { kind: 'text-offset', nodeId: 'block-3', offset: index },
    })),
  }),
}))
assertCode('LAYOUT_PLAN_INVALID', () => validateLayoutManifest({
  document,
  renderManifest: {
    pageCount: 1,
    filler: 'x'.repeat(MAX_LAYOUT_MANIFEST_BYTES),
  },
}))

console.log('Layout manifest validation: passed')
