import { downloadBlob, requestExport } from './apiClient'
import type { RenderManifest } from '../rendering/documentRenderer'

interface ExportPdfOptions {
  html: string
  filename?: string
  renderManifest?: RenderManifest
  signal?: AbortSignal
}

export async function exportToPdf({
  html,
  filename = "document.pdf",
  renderManifest,
  signal,
}: ExportPdfOptions) {
  const blob = await requestExport('pdf', { html, filename, renderManifest }, signal)
  downloadBlob(blob, filename)
}
