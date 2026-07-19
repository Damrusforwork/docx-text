import type { JSONContent } from '@tiptap/core'
import { createDocumentRevision } from './layoutContract.ts'

export { createDocumentRevision } from './layoutContract.ts'

export const DOCUMENT_SCHEMA_VERSION = 1

export interface DocumentData {
  schemaVersion: number
  documentRevision: string
  content: JSONContent
}

function isJsonContent(value: unknown): value is JSONContent {
  return typeof value === 'object'
    && value !== null
    && typeof (value as JSONContent).type === 'string'
}

export function createDocumentData(content: JSONContent): DocumentData {
  return {
    schemaVersion: DOCUMENT_SCHEMA_VERSION,
    documentRevision: createDocumentRevision(content),
    content,
  }
}

export function migrateDocumentData(value: unknown): DocumentData {
  const document = isJsonContent(value)
    ? { schemaVersion: 0, content: value }
    : value

  if (
    typeof document !== 'object'
    || document === null
    || !Number.isInteger((document as DocumentData).schemaVersion)
    || !isJsonContent((document as DocumentData).content)
  ) {
    throw new Error('Invalid document data')
  }

  const { schemaVersion, content } = document as DocumentData
  if (schemaVersion > DOCUMENT_SCHEMA_VERSION) {
    throw new Error(`Unsupported document schema version: ${schemaVersion}`)
  }
  if (schemaVersion < 0) {
    throw new Error(`Invalid document schema version: ${schemaVersion}`)
  }

  // Version 0 was raw ProseMirror JSON without an envelope.
  return createDocumentData(content)
}
