import type { Editor } from '@tiptap/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { PageMargins } from '../components/PageMarginRuler'
import type { PageBreakDecoration } from '../paginationModel'
import { renderDocumentForExport } from '../rendering/documentRenderer'
import { ApiError, type ApiErrorCode } from '../utils/apiClient'
import { exportToDocx } from '../utils/exportDocx'
import { exportToPdf } from '../utils/exportPdf'

type ExportFormat = 'PDF' | 'DOCX'

const ERROR_MESSAGES: Record<ApiErrorCode, string> = {
  INVALID_REQUEST: 'ข้อมูลเอกสารไม่ถูกต้อง',
  UNSUPPORTED_MEDIA_TYPE: 'รูปแบบข้อมูลไม่รองรับ',
  PAYLOAD_TOO_LARGE: 'เอกสารมีขนาดใหญ่เกินกำหนด',
  INVALID_DOCUMENT: 'เอกสารหรือรูปภาพภายในไม่ถูกต้อง',
  CONVERSION_TIMEOUT: 'ใช้เวลาสร้างเอกสารนานเกินกำหนด',
  CONVERSION_FAILED: 'ระบบไม่สามารถสร้างเอกสารได้',
  REQUEST_CANCELLED: 'ยกเลิกการสร้างเอกสารแล้ว',
  NETWORK_ERROR: 'ไม่สามารถเชื่อมต่อบริการสร้างเอกสารได้',
  INTERNAL_ERROR: 'ระบบเกิดข้อผิดพลาดภายใน',
}

export function useDocumentExport(
  editor: Editor | null,
  activeTemplate: string,
  margins: PageMargins,
  pageCount: number,
  pageBreaks: PageBreakDecoration[],
) {
  const [exporting, setExporting] = useState<ExportFormat | null>(null)
  const exportControllerRef = useRef<AbortController | null>(null)

  useEffect(() => () => exportControllerRef.current?.abort(), [])

  const handleExport = useCallback(async (format: ExportFormat) => {
    if (!editor || exporting) return
    const controller = new AbortController()
    exportControllerRef.current = controller
    setExporting(format)
    try {
      const rendered = renderDocumentForExport({
        editor,
        margins,
        target: format === 'PDF' ? 'pdf' : 'docx',
        pageCount,
        pageBreaks,
      })
      const filename = `${activeTemplate}.${format.toLowerCase()}`
      if (format === 'PDF') {
        await exportToPdf({
          html: rendered.html,
          filename,
          renderManifest: rendered.manifest,
          signal: controller.signal,
        })
      } else {
        await exportToDocx({
          html: rendered.html,
          filename,
          renderManifest: rendered.manifest,
          signal: controller.signal,
        })
      }
    } catch (error) {
      if (error instanceof ApiError && error.code === 'REQUEST_CANCELLED') return
      const message = error instanceof ApiError
        ? ERROR_MESSAGES[error.code]
        : 'เกิดข้อผิดพลาดที่ไม่คาดคิด'
      window.alert(`ไม่สามารถ Export ${format} ได้\n${message}`)
    } finally {
      if (exportControllerRef.current === controller) exportControllerRef.current = null
      setExporting(null)
    }
  }, [editor, exporting, activeTemplate, margins, pageCount, pageBreaks])

  const cancelExport = useCallback(() => exportControllerRef.current?.abort(), [])

  return { exporting, handleExport, cancelExport }
}
