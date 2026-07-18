import assert from 'node:assert/strict'
import { normalizeLayoutIds } from '../src/extensions/paginationState.ts'
import {
  buildPageBreakDecorations,
  buildPageLayouts,
  pageLayoutSignature,
} from '../src/paginationModel.ts'

let id = 0
const normalizedIds = normalizeLayoutIds(['same', 'same', null], () => `generated-${++id}`)
assert.deepEqual(normalizedIds, ['same', 'generated-1', 'generated-2'])

const lines = Array.from({ length: 5 }, (_, index) => ({
  startOffset: index,
  endOffset: index + 1,
  from: index + 1,
  to: index + 2,
  text: String(index + 1),
  top: index * 24,
  bottom: (index + 1) * 24,
  height: 24,
}))
const pages = buildPageLayouts([{
  blockIndex: 0,
  nodeId: 'paragraph-1',
  tagName: 'p',
  lines,
  keepWithNext: false,
  unsplittable: false,
}], 72)

assert.equal(pages.length, 2)
assert.deepEqual(pages.map((page) => page.fragments.map((fragment) => fragment.text)), [['1', '2', '3'], ['4', '5']])
assert.ok(pages.flatMap((page) => page.fragments).every((fragment) => fragment.nodeId === 'paragraph-1'))
assert.deepEqual(pages.flatMap((page) => page.fragments).map(({ from, to }) => [from, to]), [[1, 2], [2, 3], [3, 4], [4, 5], [5, 6]])
const editedPages = structuredClone(pages)
editedPages[0].fragments[0].text = 'edited'
assert.notEqual(pageLayoutSignature(pages), pageLayoutSignature(editedPages))
const breaks = buildPageBreakDecorations(pages, 72, 10, 10, 20)
assert.deepEqual(breaks, [{ pageNumber: 2, from: 4, heightPx: 40 }])

console.log('Pagination state IDs and PageLayout builder: passed')
