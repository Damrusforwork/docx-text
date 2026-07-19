import assert from 'node:assert/strict'
import {
  DOCUMENT_SCHEMA_VERSION,
  createDocumentData,
  createDocumentRevision,
  migrateDocumentData,
} from '../src/documentSchema.ts'

const content = {
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'ทดสอบ' }] }],
}

const expected = {
  schemaVersion: DOCUMENT_SCHEMA_VERSION,
  documentRevision: createDocumentRevision(content),
  content,
}

assert.deepEqual(createDocumentData(content), {
  ...expected,
})
assert.deepEqual(migrateDocumentData(content), {
  ...expected,
})
assert.deepEqual(migrateDocumentData({ schemaVersion: 1, content }), {
  ...expected,
})
assert.notEqual(createDocumentRevision(content), createDocumentRevision({
  ...content,
  content: [...content.content, { type: 'paragraph' }],
}))
assert.throws(
  () => migrateDocumentData({ schemaVersion: DOCUMENT_SCHEMA_VERSION + 1, content }),
  /Unsupported document schema version/,
)
assert.throws(() => migrateDocumentData({ schemaVersion: 1 }), /Invalid document data/)

console.log('Document schema migration: passed')
