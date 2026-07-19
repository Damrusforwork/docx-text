import { useCallback, useState } from 'react'
import { EditorContent } from '@tiptap/react'
import {
  AlertTriangle,
  FileDown,
  FileText,
  FileUp,
  Upload,
} from 'lucide-react'
import { useDocumentEditor } from '../hooks/useDocumentEditor'
import { useDocumentExport } from '../hooks/useDocumentExport'
import { useDocumentImport } from '../hooks/useDocumentImport'
import { usePagination } from '../hooks/usePagination'
import { DOCUMENT_PAGE_SPEC } from '../pageSpec'
import { buildPreviewPageStyle } from '../rendering/documentRenderer'
import { templates } from '../templates'
import PageMarginRuler, { type PageMargins } from './PageMarginRuler'
import PdfAnnotator from './PdfAnnotator'
import Toolbar from './Toolbar'

export default function DocumentEditorPage() {
  const [activeTemplate, setActiveTemplate] = useState('internalMemo')
  const [margins, setMargins] = useState<PageMargins>({
    ...DOCUMENT_PAGE_SPEC.defaultMargins,
  })
  const editor = useDocumentEditor()
  const handleDocxImported = useCallback(() => setActiveTemplate(''), [])
  const {
    importWarnings,
    setImportWarnings,
    showImportMenu,
    setShowImportMenu,
    pdfMode,
    pdfPages,
    pdfData,
    handleImportFile,
    handleExitPdfMode,
  } = useDocumentImport(editor, handleDocxImported)
  const { pageRef, pageCount, currentPage, pageBreaks, pagePlan } = usePagination(editor, margins)
  const { exporting, handleExport, cancelExport } = useDocumentExport(
    editor,
    activeTemplate,
    margins,
    pageCount,
    pageBreaks,
    pagePlan,
  )

  const switchTemplate = useCallback((key: string) => {
    if (!editor) return
    setActiveTemplate(key)
    setImportWarnings([])
    editor.commands.setContent(templates[key].html)
  }, [editor, setImportWarnings])

  if (pdfMode && pdfPages.length > 0 && pdfData) {
    return (
      <PdfAnnotator
        pages={pdfPages}
        pdfData={pdfData}
        onExit={handleExitPdfMode}
      />
    )
  }

  return (
    <div className="editor-wrapper">
      <div className="editor-header no-print">
        <h1>Rish text editer</h1>
      </div>

      <div className="toolbar no-print">
        <Toolbar editor={editor} />

        <div className="toolbar-divider" />

        <div className="toolbar-group">
          <div className="template-selector">
            <FileText size={14} />
            <select
              value={activeTemplate}
              onChange={(event) => switchTemplate(event.target.value)}
            >
              {Object.entries(templates).map(([key, template]) => (
                <option key={key} value={key}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-group">
          <PageMarginRuler margins={margins} onChange={setMargins} />
        </div>

        <div className="page-status" title="หน้าปัจจุบันและจำนวนหน้าจาก A4 preview">
          หน้า {currentPage} / {pageCount}
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-group">
          <button
            className="toolbar-btn export-action"
            onClick={() => void handleExport('DOCX')}
            disabled={Boolean(exporting)}
            title="Export as DOCX"
          >
            <FileDown size={16} />
            <span>{exporting === 'DOCX' ? 'กำลังสร้าง...' : 'DOCX'}</span>
          </button>
          <button
            className="toolbar-btn export-action"
            onClick={() => void handleExport('PDF')}
            disabled={Boolean(exporting)}
            title="Export as PDF"
          >
            <FileDown size={16} />
            <span>{exporting === 'PDF' ? 'กำลังสร้าง...' : 'PDF'}</span>
          </button>

          <div className="import-wrapper">
            <button
              className="toolbar-btn export-action"
              onClick={() => setShowImportMenu(!showImportMenu)}
              title="Import file"
            >
              <FileUp size={16} />
              <span>Import</span>
            </button>
            {showImportMenu && (
              <div className="import-dropdown">
                <label className="import-option">
                  <Upload size={14} />
                  <span>Import DOCX</span>
                  <input
                    type="file"
                    accept=".docx"
                    onChange={handleImportFile}
                    hidden
                  />
                </label>
                <label className="import-option">
                  <Upload size={14} />
                  <span>Import PDF</span>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleImportFile}
                    hidden
                  />
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      {exporting && (
        <div className="export-progress no-print" role="status" aria-live="polite">
          <span className="export-spinner" aria-hidden="true" />
          กำลังสร้างไฟล์ {exporting} กรุณารอสักครู่...
          <button type="button" className="export-cancel" onClick={cancelExport}>
            ยกเลิก
          </button>
        </div>
      )}

      {importWarnings.length > 0 && (
        <div className="import-warnings no-print">
          <AlertTriangle size={16} />
          <div>
            <strong>Import Warnings:</strong>
            <ul>
              {importWarnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="page-container">
        <div
          ref={pageRef}
          className="page a4-page canonical-page-renderer"
          style={buildPreviewPageStyle(pageCount, margins)}
        >
          <div className="page-sheets canonical-page-sheets" aria-hidden="true">
            {Array.from({ length: pageCount }, (_, index) => (
              <section
                className="page-sheet"
                key={index}
                style={{
                  top: `calc(${index * DOCUMENT_PAGE_SPEC.heightCm}cm + ${index * DOCUMENT_PAGE_SPEC.gapPx}px)`,
                  height: `${DOCUMENT_PAGE_SPEC.heightCm}cm`,
                }}
              >
                <header className="page-sheet-header" />
                <div
                  className="page-sheet-content-area"
                  style={{
                    top: `${margins.top}cm`,
                    bottom: `${margins.bottom}cm`,
                    left: `${margins.left}cm`,
                    right: `${margins.right}cm`,
                  }}
                />
                <footer className="page-sheet-footer">หน้า {index + 1}</footer>
              </section>
            ))}
          </div>
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  )
}
