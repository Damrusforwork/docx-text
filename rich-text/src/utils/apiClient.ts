import { APP_CONFIG } from '../config'
import type { RenderManifest } from '../rendering/documentRenderer'

export type ApiErrorCode =
  | 'INVALID_REQUEST'
  | 'UNSUPPORTED_MEDIA_TYPE'
  | 'PAYLOAD_TOO_LARGE'
  | 'INVALID_DOCUMENT'
  | 'CONVERSION_TIMEOUT'
  | 'CONVERSION_FAILED'
  | 'REQUEST_CANCELLED'
  | 'NETWORK_ERROR'
  | 'INTERNAL_ERROR'

export class ApiError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly status?: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function waitBeforeRetry(attempt: number, signal?: AbortSignal) {
  if (signal?.aborted) throw new ApiError('REQUEST_CANCELLED', 'Request cancelled')
  await new Promise<void>((resolve, reject) => {
    const finish = () => {
      signal?.removeEventListener('abort', cancel)
      resolve()
    }
    const cancel = () => {
      window.clearTimeout(timer)
      reject(new ApiError('REQUEST_CANCELLED', 'Request cancelled'))
    }
    const timer = window.setTimeout(finish, 500 * (attempt + 1))
    signal?.addEventListener('abort', cancel, { once: true })
  })
}

async function validateExportBlob(format: 'pdf' | 'docx', response: Response) {
  const expectedMime = format === 'pdf'
    ? 'application/pdf'
    : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  const blob = await response.blob()
  const signature = new Uint8Array(await blob.slice(0, 5).arrayBuffer())
  const validSignature = format === 'pdf'
    ? String.fromCharCode(...signature) === '%PDF-'
    : signature.length >= 4
      && signature[0] === 0x50
      && signature[1] === 0x4b
      && signature[2] === 0x03
      && signature[3] === 0x04
  if (!response.headers.get('content-type')?.startsWith(expectedMime) || !validSignature) {
    throw new ApiError('INVALID_DOCUMENT', 'Conversion service returned an invalid document.')
  }
  return blob
}

async function parseApiError(response: Response): Promise<ApiError> {
  const payload = await response.json().catch(() => null) as {
    code?: ApiErrorCode
    message?: string
  } | null
  return new ApiError(
    payload?.code || 'CONVERSION_FAILED',
    payload?.message || 'Document conversion failed.',
    response.status,
  )
}

export async function requestExport(
  format: 'pdf' | 'docx',
  body: { html: string; filename: string; renderManifest?: RenderManifest },
  signal?: AbortSignal,
): Promise<Blob> {
  for (let attempt = 0; attempt <= APP_CONFIG.exportRetryCount; attempt += 1) {
    const timeoutSignal = AbortSignal.timeout(APP_CONFIG.exportTimeoutMs)
    const requestSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal

    try {
      const response = await fetch(`${APP_CONFIG.apiBaseUrl}/convert/${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: requestSignal,
      })

      if (response.ok) return validateExportBlob(format, response)
      if ([502, 503].includes(response.status) && attempt < APP_CONFIG.exportRetryCount) {
        await waitBeforeRetry(attempt, signal)
        continue
      }
      throw await parseApiError(response)
    } catch (error) {
      if (signal?.aborted) throw new ApiError('REQUEST_CANCELLED', 'Request cancelled')
      if (timeoutSignal.aborted) throw new ApiError('CONVERSION_TIMEOUT', 'Conversion timed out')
      if (error instanceof ApiError) throw error
      if (attempt < APP_CONFIG.exportRetryCount) {
        await waitBeforeRetry(attempt, signal)
        continue
      }
      throw new ApiError('NETWORK_ERROR', 'Unable to connect to the conversion service.')
    }
  }
  throw new ApiError('NETWORK_ERROR', 'Unable to connect to the conversion service.')
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
