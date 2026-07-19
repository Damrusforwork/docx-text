import { APP_CONFIG } from '../config'

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const MAX_ZIP_ENTRIES = 2_000
const MAX_ZIP_UNCOMPRESSED_BYTES = 100 * 1024 * 1024
const MAX_ZIP_COMPRESSION_RATIO = 100

export type ImportErrorCode =
  | 'UNSUPPORTED_MEDIA_TYPE'
  | 'PAYLOAD_TOO_LARGE'
  | 'INVALID_DOCUMENT'

export class ImportValidationError extends Error {
  readonly code: ImportErrorCode

  constructor(code: ImportErrorCode, message: string) {
    super(message)
    this.name = 'ImportValidationError'
    this.code = code
  }
}

function findEndOfCentralDirectory(view: DataView): number {
  const minimumOffset = Math.max(0, view.byteLength - 65_557)
  for (let offset = view.byteLength - 22; offset >= minimumOffset; offset -= 1) {
    if (view.getUint32(offset, true) === 0x06054b50) return offset
  }
  throw new ImportValidationError('INVALID_DOCUMENT', 'DOCX archive is incomplete.')
}

export function inspectDocxArchive(arrayBuffer: ArrayBuffer) {
  const view = new DataView(arrayBuffer)
  const endOffset = findEndOfCentralDirectory(view)
  const entryCount = view.getUint16(endOffset + 10, true)
  const centralOffset = view.getUint32(endOffset + 16, true)
  if (entryCount > MAX_ZIP_ENTRIES) {
    throw new ImportValidationError('PAYLOAD_TOO_LARGE', 'DOCX contains too many entries.')
  }

  let offset = centralOffset
  let compressedBytes = 0
  let uncompressedBytes = 0
  for (let index = 0; index < entryCount; index += 1) {
    if (offset + 46 > view.byteLength || view.getUint32(offset, true) !== 0x02014b50) {
      throw new ImportValidationError('INVALID_DOCUMENT', 'DOCX central directory is invalid.')
    }
    const compressedSize = view.getUint32(offset + 20, true)
    const uncompressedSize = view.getUint32(offset + 24, true)
    if (compressedSize === 0xffffffff || uncompressedSize === 0xffffffff) {
      throw new ImportValidationError('PAYLOAD_TOO_LARGE', 'ZIP64 DOCX files are not supported.')
    }
    compressedBytes += compressedSize
    uncompressedBytes += uncompressedSize
    if (uncompressedBytes > MAX_ZIP_UNCOMPRESSED_BYTES) {
      throw new ImportValidationError('PAYLOAD_TOO_LARGE', 'DOCX expands beyond the allowed size.')
    }
    const nameLength = view.getUint16(offset + 28, true)
    const extraLength = view.getUint16(offset + 30, true)
    const commentLength = view.getUint16(offset + 32, true)
    offset += 46 + nameLength + extraLength + commentLength
  }

  if (uncompressedBytes > 0 && compressedBytes === 0) {
    throw new ImportValidationError('INVALID_DOCUMENT', 'DOCX compression data is invalid.')
  }
  if (compressedBytes > 0 && uncompressedBytes / compressedBytes > MAX_ZIP_COMPRESSION_RATIO) {
    throw new ImportValidationError('PAYLOAD_TOO_LARGE', 'DOCX compression ratio is too high.')
  }
}

export async function validateImportFile(file: File, format: 'pdf' | 'docx') {
  const expectedExtension = `.${format}`
  if (!file.name.toLowerCase().endsWith(expectedExtension)) {
    throw new ImportValidationError('UNSUPPORTED_MEDIA_TYPE', `Expected a ${expectedExtension} file.`)
  }
  const expectedMime = format === 'pdf' ? 'application/pdf' : DOCX_MIME
  if (file.type && file.type !== expectedMime) {
    throw new ImportValidationError('UNSUPPORTED_MEDIA_TYPE', `Invalid ${format.toUpperCase()} MIME type.`)
  }
  if (file.size > APP_CONFIG.maxImportFileBytes) {
    throw new ImportValidationError('PAYLOAD_TOO_LARGE', 'Import file exceeds the allowed size.')
  }

  const arrayBuffer = await file.arrayBuffer()
  const signature = new Uint8Array(arrayBuffer, 0, Math.min(5, arrayBuffer.byteLength))
  const validSignature = format === 'pdf'
    ? String.fromCharCode(...signature) === '%PDF-'
    : signature.length >= 4
      && signature[0] === 0x50
      && signature[1] === 0x4b
      && signature[2] === 0x03
      && signature[3] === 0x04
  if (!validSignature) {
    throw new ImportValidationError('INVALID_DOCUMENT', `Invalid ${format.toUpperCase()} file signature.`)
  }
  if (format === 'docx') inspectDocxArchive(arrayBuffer)
  return arrayBuffer
}
