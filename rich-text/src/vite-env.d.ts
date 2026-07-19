/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_PDF_WORKER_URL?: string
  readonly VITE_EXPORT_TIMEOUT_MS?: string
  readonly VITE_EXPORT_RETRY_COUNT?: string
  readonly VITE_MAX_IMPORT_FILE_MB?: string
  readonly VITE_MAX_PDF_PAGES?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
