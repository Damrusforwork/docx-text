import assert from 'node:assert/strict'
import {
  buildCanonicalPagePlan,
  createDocumentRevision,
  createLayoutFingerprint,
  isCanonicalPagePlan,
} from '../src/layoutContract.ts'

const document = {
  type: 'doc',
  content: [
    { type: 'paragraph', attrs: { layoutId: 'block-a' }, content: [{ type: 'text', text: 'A' }] },
    { type: 'paragraph', attrs: { layoutId: 'block-b' }, content: [{ type: 'text', text: 'B' }] },
  ],
}

const pages = [
  {
    pageNumber: 1,
    usedHeightPx: 24,
    fragments: [{ nodeId: 'block-a', blockIndex: 0, lineIndex: 0, from: 1, to: 2, text: 'A', heightPx: 24 }],
  },
  {
    pageNumber: 2,
    usedHeightPx: 24,
    fragments: [{ nodeId: 'block-b', blockIndex: 1, lineIndex: 0, from: 3, to: 4, text: 'B', heightPx: 24 }],
  },
  {
    pageNumber: 3,
    usedHeightPx: 24,
    fragments: [{ nodeId: 'block-b', blockIndex: 1, lineIndex: 1, from: 4, to: 5, text: 'C', heightPx: 24 }],
  },
]

const margins = { top: 1, bottom: 2.5, left: 3, right: 1.5 }
const plan = buildCanonicalPagePlan({ document, margins, pages })

assert.ok(isCanonicalPagePlan(plan))
assert.equal(plan.version, 1)
assert.equal(plan.pageCount, 3)
assert.deepEqual(plan.breaks, [
  { pageNumber: 2, source: 'automatic', position: { kind: 'before-block', nodeId: 'block-b' } },
  { pageNumber: 3, source: 'automatic', position: { kind: 'text-offset', nodeId: 'block-b', offset: 4 } },
])

assert.equal(createDocumentRevision(document), createDocumentRevision(structuredClone(document)))
assert.notEqual(
  createDocumentRevision(document),
  createDocumentRevision({ ...document, content: [...document.content, { type: 'paragraph' }] }),
)

assert.equal(plan.layoutFingerprint, createLayoutFingerprint(plan.documentRevision, margins))
assert.notEqual(
  createLayoutFingerprint(plan.documentRevision, margins),
  createLayoutFingerprint(plan.documentRevision, { ...margins, top: 2 }),
)

assert.equal(isCanonicalPagePlan({ ...plan, pageCount: 0 }), false)
assert.equal(
  isCanonicalPagePlan({
    ...plan,
    breaks: [{ pageNumber: 1, source: 'automatic', position: { kind: 'before-block', nodeId: 'x' } }],
  }),
  false,
)

console.log('Canonical layout contract: passed')
