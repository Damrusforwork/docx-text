import type { Editor } from '@tiptap/react'
import type { ChangeEvent } from 'react'
import { useCallback, useState } from 'react'
import type { PdfPageData } from '../utils/importPdf'
import { importDocx } from '../utils/importDocx'
import { importPdf } from '../utils/importPdf'
import { ImportValidationError, type ImportErrorCode } from '../utils/importValidation'

const IMPORT_ERROR_MESSAGES: Record<ImportErrorCode, string> = {
  UNSUPPORTED_MEDIA_TYPE: 'ชนิดไฟล์ไม่ถูกต้องหรือไม่รองรับ',
  PAYLOAD_TOO_LARGE: 'ไฟล์มีขนาดหรือเนื้อหามากเกินกำหนด',
  INVALID_DOCUMENT: 'โครงสร้างไฟล์ไม่ถูกต้องหรือไฟล์เสียหาย',
}

export function useDocumentImport(editor: Editor | null, onDocxImported: () => void) {
  const [importWarnings, setImportWarnings] = useState<string[]>([])
  const [showImportMenu, setShowImportMenu] = useState(false)
  const [pdfMode, setPdfMode] = useState(false)
  const [pdfPages, setPdfPages] = useState<PdfPageData[]>([])
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null)

  const handleImportFile = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !editor) return

    const extension = file.name.split('.').pop()?.toLowerCase()
    setImportWarnings([])

    try {
      if (extension === 'docx') {
        const { html, warnings } = await importDocx(file)
        editor.commands.setContent(html)
        setImportWarnings(warnings)
        onDocxImported()
      } else if (extension === 'pdf') {
        const result = await importPdf(file)
        setPdfPages(result.pages)
        setPdfData(result.pdfData)
        setPdfMode(true)
      } else {
        setImportWarnings(['Unsupported file type. Please use .docx or .pdf'])
      }
    } catch (error) {
      const message = error instanceof ImportValidationError
        ? IMPORT_ERROR_MESSAGES[error.code]
        : 'ไม่สามารถนำเข้าเอกสารได้'
      setImportWarnings([message])
    }

    event.target.value = ''
  }, [editor, onDocxImported])

  const handleExitPdfMode = useCallback(() => {
    setPdfMode(false)
    setPdfPages([])
    setPdfData(null)
  }, [])

  return {
    importWarnings,
    setImportWarnings,
    showImportMenu,
    setShowImportMenu,
    pdfMode,
    pdfPages,
    pdfData,
    handleImportFile,
    handleExitPdfMode,
  }
}
