import { buildExportHtml, type DocumentMargins, type SignatureExport } from './documentExport'
import { DOCUMENT_PAGE_SPEC } from '../pageSpec'

const API_BASE = 'http://localhost:3001/api'

interface ExportDocxOptions {
  html: string
  filename?: string
  signatures?: SignatureExport[]
  margins?: DocumentMargins
}

export async function exportToDocx({
  html,
  filename = "document.docx",
  signatures = [],
  margins = DOCUMENT_PAGE_SPEC.defaultMargins,
}: ExportDocxOptions) {
  const fullHtml = buildExportHtml({ html, signatures, margins })

  const response = await fetch(`${API_BASE}/convert/docx`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ html: fullHtml, filename }),
  })

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`DOCX conversion failed: ${response.status} ${text}`)
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
