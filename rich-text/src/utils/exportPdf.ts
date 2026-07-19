import { downloadBlob, requestExport } from './apiClient'
import type { DocumentData } from '../documentSchema'
import type { RenderManifest } from '../rendering/documentRenderer'

interface ExportPdfOptions {
  html: string
  filename?: string
  document?: DocumentData
  renderManifest?: RenderManifest
  legacyLayout?: boolean
  signal?: AbortSignal
}

export async function exportToPdf({
  html,
  filename = "document.pdf",
  document,
  renderManifest,
  legacyLayout,
  signal,
}: ExportPdfOptions) {
  const blob = await requestExport('pdf', { html, filename, document, renderManifest, legacyLayout }, signal)
  downloadBlob(blob, filename)
}
