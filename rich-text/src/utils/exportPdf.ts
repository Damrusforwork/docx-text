import { buildExportHtml, type DocumentMargins } from './documentExport'
import { DOCUMENT_PAGE_SPEC } from '../pageSpec'

const API_BASE = 'http://localhost:3001/api'

interface ExportPdfOptions {
  html: string
  filename?: string
  margins?: DocumentMargins
}

export async function exportToPdf({
  html,
  filename = "document.pdf",
  margins = DOCUMENT_PAGE_SPEC.defaultMargins,
}: ExportPdfOptions) {
  const fullHtml = buildExportHtml({ html, margins })

  const response = await fetch(`${API_BASE}/convert/pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ html: fullHtml, filename }),
  })

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`PDF conversion failed: ${response.status} ${text}`)
  }

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
