import { downloadBlob, requestExport } from './apiClient'
import type { DocumentData } from '../documentSchema'
import type { RenderManifest } from '../rendering/documentRenderer'

interface ExportDocxOptions {
  html: string
  filename?: string
  document?: DocumentData
  renderManifest?: RenderManifest
  legacyLayout?: boolean
  signal?: AbortSignal
}

export async function exportToDocx({
  html,
  filename = "document.docx",
  document,
  renderManifest,
  legacyLayout,
  signal,
}: ExportDocxOptions) {
  const blob = await requestExport('docx', { html, filename, document, renderManifest, legacyLayout }, signal)
  downloadBlob(blob, filename)
}
