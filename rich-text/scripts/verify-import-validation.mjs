import assert from 'node:assert/strict'
import { inspectDocxArchive, ImportValidationError } from '../src/utils/importValidation.ts'

function createArchiveSizes(compressedSize, uncompressedSize) {
  const buffer = new ArrayBuffer(68)
  const view = new DataView(buffer)
  view.setUint32(0, 0x02014b50, true)
  view.setUint32(20, compressedSize, true)
  view.setUint32(24, uncompressedSize, true)
  view.setUint32(46, 0x06054b50, true)
  view.setUint16(56, 1, true)
  view.setUint32(58, 46, true)
  view.setUint32(62, 0, true)
  return buffer
}

assert.doesNotThrow(() => inspectDocxArchive(createArchiveSizes(1_000, 50_000)))
assert.throws(
  () => inspectDocxArchive(createArchiveSizes(1, 1_000)),
  (error) => error instanceof ImportValidationError && error.code === 'PAYLOAD_TOO_LARGE',
)

console.log('Import archive limits: passed')
