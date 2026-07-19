function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function nonNegativeInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback
}

const env = import.meta.env ?? {}

export const APP_CONFIG = {
  apiBaseUrl: (env.VITE_API_BASE_URL || 'http://localhost:3001/api').replace(/\/$/, ''),
  pdfWorkerUrl: env.VITE_PDF_WORKER_URL
    || 'https://unpkg.com/pdfjs-dist@4.9.155/build/pdf.worker.min.mjs',
  exportTimeoutMs: positiveInteger(env.VITE_EXPORT_TIMEOUT_MS, 150_000),
  exportRetryCount: Math.min(nonNegativeInteger(env.VITE_EXPORT_RETRY_COUNT, 1), 3),
  maxImportFileBytes: positiveInteger(env.VITE_MAX_IMPORT_FILE_MB, 25) * 1024 * 1024,
  maxPdfPages: positiveInteger(env.VITE_MAX_PDF_PAGES, 100),
} as const
