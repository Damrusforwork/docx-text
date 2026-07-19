import assert from 'node:assert/strict'
import {
  DOCUMENT_SCHEMA_VERSION,
  createDocumentData,
  migrateDocumentData,
} from '../src/documentSchema.ts'

const content = {
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'ทดสอบ' }] }],
}

assert.deepEqual(createDocumentData(content), {
  schemaVersion: DOCUMENT_SCHEMA_VERSION,
  content,
})
assert.deepEqual(migrateDocumentData(content), {
  schemaVersion: DOCUMENT_SCHEMA_VERSION,
  content,
})
assert.deepEqual(migrateDocumentData({ schemaVersion: 1, content }), {
  schemaVersion: DOCUMENT_SCHEMA_VERSION,
  content,
})
assert.throws(
  () => migrateDocumentData({ schemaVersion: DOCUMENT_SCHEMA_VERSION + 1, content }),
  /Unsupported document schema version/,
)
assert.throws(() => migrateDocumentData({ schemaVersion: 1 }), /Invalid document data/)

console.log('Document schema migration: passed')
