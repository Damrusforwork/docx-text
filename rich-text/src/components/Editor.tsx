import { useState, useCallback, useEffect, useRef } from 'react'
import { Color } from '@tiptap/extension-color'
import { Highlight } from '@tiptap/extension-highlight'
import { Image } from '@tiptap/extension-image'
import { Placeholder } from '@tiptap/extension-placeholder'
import { Table } from '@tiptap/extension-table'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableRow } from '@tiptap/extension-table-row'
import { TextAlign } from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import { FontFamily } from '@tiptap/extension-font-family'
import { FontSize } from '../extensions/fontSize'
import { Underline } from '@tiptap/extension-underline'
import { EditorContent, useEditor } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import {
  FileDown,
  FileUp,
  FileText,
  Upload,
  AlertTriangle,
} from 'lucide-react'
import Toolbar from './Toolbar'
import PageMarginRuler, { type PageMargins } from './PageMarginRuler'
import SignatureManager from './SignatureManager'
import SignatureLayer from './SignatureLayer'
import PdfAnnotator from './PdfAnnotator'
import type { SignatureData } from './SignatureLayer'
import type { PdfPageData } from '../utils/importPdf'
import { templates } from '../templates/index'
import { exportToDocx } from '../utils/exportDocx'
import { exportToPdf } from '../utils/exportPdf'
import { importDocx } from '../utils/importDocx'
import { importPdf } from '../utils/importPdf'

export default function Editor() {
  const [activeTemplate, setActiveTemplate] = useState<string>('internalMemo')
  const [importWarnings, setImportWarnings] = useState<string[]>([])
  const [showImportMenu, setShowImportMenu] = useState<boolean>(false)
  const [margins, setMargins] = useState<PageMargins>({
    top: 2.5,
    bottom: 2.5,
    left: 3,
    right: 1.5,
  })
  const [signatures, setSignatures] = useState<SignatureData[]>([])
  const [pdfMode, setPdfMode] = useState(false)
  const [pdfPages, setPdfPages] = useState<PdfPageData[]>([])
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null)
  const [pageCount, setPageCount] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const pageRef = useRef<HTMLDivElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Image.configure({ inline: false, allowBase64: true }),
      Highlight,
      Underline,
      Placeholder.configure({ placeholder: 'เริ่มพิมพ์เอกสาร...' }),
      TextStyle,
      FontFamily,
      FontSize,
      Color,
    ],
    content: templates.internalMemo.content,
    editorProps: { attributes: { class: 'document-content' } },
  })

  const switchTemplate = useCallback(
    (key: string) => {
      if (!editor) return
      setActiveTemplate(key)
      setImportWarnings([])
      editor.commands.setContent(templates[key].content)
    },
    [editor]
  )

  const handleExportDocx = useCallback(() => {
    if (!editor) return
    const html = editor.getHTML()
    exportToDocx({
      html,
      filename: `${activeTemplate}.docx`,
      signatures: signatures.map((s) => ({
        dataUrl: s.dataUrl,
        signerName: s.signerName,
        position: s.position,
        size: s.size,
      })),
      margins,
    })
  }, [editor, activeTemplate, signatures, margins])

  const handleExportPdf = useCallback(() => {
    if (!editor) return
    const html = editor.getHTML()
    exportToPdf({
      html,
      filename: `${activeTemplate}.pdf`,
      signatures: signatures.map((s) => ({
        dataUrl: s.dataUrl,
        signerName: s.signerName,
        position: s.position,
        size: s.size,
      })),
      margins,
    })
  }, [editor, activeTemplate, signatures, margins])

  const handleImportFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file || !editor) return

      const ext = file.name.split('.').pop()?.toLowerCase()
      setImportWarnings([])

      try {
        if (ext === 'docx') {
          const { html, warnings } = await importDocx(file)
          editor.commands.setContent(html)
          if (warnings.length) setImportWarnings(warnings)
          setActiveTemplate('')
        } else if (ext === 'pdf') {
          const result = await importPdf(file)
          setPdfPages(result.pages)
          setPdfData(result.pdfData)
          setPdfMode(true)
        } else {
          setImportWarnings(['Unsupported file type. Please use .docx or .pdf'])
        }
      } catch (err) {
        setImportWarnings([`Import error: ${(err as Error).message}`])
      }

      e.target.value = ''
    },
    [editor]
  )

  const handleAddSignature = useCallback((sig: SignatureData) => {
    setSignatures((prev) => [...prev, sig])
  }, [])

  const handleRemoveSignature = useCallback((id: string) => {
    setSignatures((prev) => prev.filter((s) => s.id !== id))
  }, [])

  const handleUpdateSignature = useCallback((id: string, updates: Partial<SignatureData>) => {
    setSignatures((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)))
  }, [])

  const handleClearSignatures = useCallback(() => {
    setSignatures([])
  }, [])

  const handleExitPdfMode = useCallback(() => {
    setPdfMode(false)
    setPdfPages([])
    setPdfData(null)
  }, [])

  useEffect(() => {
    if (!editor) return

    const centimetersToPixels = (centimeters: number) => centimeters * (96 / 2.54)
    const pageHeight = centimetersToPixels(29.7)

    const recalculatePages = () => {
      const content = pageRef.current?.querySelector<HTMLElement>('.document-content')
      if (!content) return
      const usableHeight = Math.max(
        1,
        pageHeight - centimetersToPixels(margins.top + margins.bottom),
      )
      setPageCount(Math.max(1, Math.ceil(content.scrollHeight / usableHeight)))
    }

    const updateCurrentPage = () => {
      const page = pageRef.current
      if (!page) return
      try {
        const caret = editor.view.coordsAtPos(editor.state.selection.head)
        const pageTop = page.getBoundingClientRect().top
        const nextPage = Math.floor(Math.max(0, caret.top - pageTop) / pageHeight) + 1
        setCurrentPage(Math.min(Math.max(1, nextPage), pageCount))
      } catch {
        setCurrentPage(1)
      }
    }

    let frame = 0
    const scheduleRecalculation = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        recalculatePages()
        updateCurrentPage()
      })
    }
    const content = pageRef.current?.querySelector<HTMLElement>('.document-content')
    const resizeObserver = new ResizeObserver(scheduleRecalculation)
    if (content) resizeObserver.observe(content)
    editor.on('update', scheduleRecalculation)
    editor.on('selectionUpdate', updateCurrentPage)
    scheduleRecalculation()

    return () => {
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      editor.off('update', scheduleRecalculation)
      editor.off('selectionUpdate', updateCurrentPage)
    }
  }, [editor, margins, pageCount])

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
        <h1>Template + Import/Export</h1>
      </div>

      <div className="toolbar no-print">
        <Toolbar editor={editor} />

        <div className="toolbar-divider" />

        <div className="toolbar-group">
          <div className="template-selector">
            <FileText size={14} />
            <select
              value={activeTemplate}
              onChange={(e) => switchTemplate(e.target.value)}
            >
              {Object.entries(templates).map(([key, t]) => (
                <option key={key} value={key}>
                  {t.name}
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
            onClick={handleExportDocx}
            title="Export as DOCX"
          >
            <FileDown size={16} />
            <span>DOCX</span>
          </button>
          <button
            className="toolbar-btn export-action"
            onClick={handleExportPdf}
            title="Export as PDF"
          >
            <FileDown size={16} />
            <span>PDF</span>
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

      {importWarnings.length > 0 && (
        <div className="import-warnings no-print">
          <AlertTriangle size={16} />
          <div>
            <strong>Import Warnings:</strong>
            <ul>
              {importWarnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="page-container">
        <div
          ref={pageRef}
          className="page a4-page"
          style={{
            minHeight: `${pageCount * 29.7}cm`,
            paddingTop: `${margins.top}cm`,
            paddingBottom: `${margins.bottom}cm`,
            paddingLeft: `${margins.left}cm`,
            paddingRight: `${margins.right}cm`,
          }}
        >
          <div className="page-guides" aria-hidden="true">
            {Array.from({ length: pageCount }, (_, index) => (
              <div className="page-guide" key={index} style={{ top: `${index * 29.7}cm` }}>
                <span className="page-number">หน้า {index + 1}</span>
                {index < pageCount - 1 && <span className="page-break-label">Page break</span>}
              </div>
            ))}
          </div>
          <EditorContent editor={editor} />

          {/* <div className="page-footer">
            <span className="footer-text">หน้า 1</span>
            <div className="footer-line" />
          </div> */}

          <SignatureLayer
            signatures={signatures}
            onUpdate={handleUpdateSignature}
            onRemove={handleRemoveSignature}
          />
        </div>
      </div>
    </div>
  )
}
