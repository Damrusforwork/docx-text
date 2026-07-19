import { downloadBlob, requestExport } from './apiClient'
import type { RenderManifest } from '../rendering/documentRenderer'

interface ExportDocxOptions {
  html: string
  filename?: string
  renderManifest?: RenderManifest
  signal?: AbortSignal
}

export async function exportToDocx({
  html,
  filename = "document.docx",
  renderManifest,
  signal,
}: ExportDocxOptions) {
  const blob = await requestExport('docx', { html, filename, renderManifest }, signal)
  downloadBlob(blob, filename)
}
