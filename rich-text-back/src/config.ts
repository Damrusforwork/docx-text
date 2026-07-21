function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

try {
  process.loadEnvFile()
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
}

export const BACKEND_CONFIG = {
  port: positiveInteger(process.env.PORT, 3001),
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:5174,http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  jsonBodyLimit: process.env.JSON_BODY_LIMIT || '50mb',
  maxHtmlBytes: positiveInteger(process.env.MAX_HTML_BYTES, 40_000_000),
  maxEmbeddedImages: positiveInteger(process.env.MAX_EMBEDDED_IMAGES, 100),
  maxEmbeddedImageBytes: positiveInteger(process.env.MAX_EMBEDDED_IMAGE_BYTES, 25_000_000),
  libreOfficeTimeoutMs: positiveInteger(process.env.LIBREOFFICE_TIMEOUT_MS, 60_000),
} as const
