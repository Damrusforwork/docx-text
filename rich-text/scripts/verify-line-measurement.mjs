import assert from 'node:assert/strict'
import { findLineBreakIndex, groupLineTokens } from '../src/lineMeasurement.ts'

const tokens = [
  { startOffset: 0, endOffset: 1, text: 'ก', top: 0, bottom: 24 },
  { startOffset: 1, endOffset: 2, text: 'ข', top: 0.2, bottom: 24.2 },
  { startOffset: 2, endOffset: 3, text: 'ค', top: 24, bottom: 48 },
  { startOffset: 3, endOffset: 4, text: 'ง', top: 48, bottom: 72 },
  { startOffset: 4, endOffset: 5, text: 'จ', top: 72, bottom: 96 },
  { startOffset: 5, endOffset: 6, text: 'ฉ', top: 96, bottom: 120 },
]

const lines = groupLineTokens(tokens)
assert.equal(lines.length, 5)
assert.equal(lines[0].text, 'กข')
assert.equal(findLineBreakIndex(lines, 48), 2)
assert.equal(findLineBreakIndex(lines, 24), 0, 'orphan rule moves the whole block')
assert.equal(findLineBreakIndex(lines, 96), 0, 'widow rule keeps two lines on the next page')
assert.equal(findLineBreakIndex(lines, 120), null, 'no break when all lines fit')

console.log('Line measurement grouping and widow/orphan rules: passed')
