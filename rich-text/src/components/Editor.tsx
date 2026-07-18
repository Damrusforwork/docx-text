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
import PdfAnnotator from './PdfAnnotator'
import type { PdfPageData } from '../utils/importPdf'
import { DOCUMENT_PAGE_SPEC } from '../pageSpec'
import { measureDocumentLines } from '../lineMeasurement'
import {
  buildPageBreakDecorations,
  buildPageLayouts,
  pageLayoutSignature,
} from '../paginationModel'
import {
  PaginationState,
  setPageBreaks,
} from '../extensions/paginationState'
import { templates } from '../templates/index'
import { exportToDocx } from '../utils/exportDocx'
import { exportToPdf } from '../utils/exportPdf'
import { importDocx } from '../utils/importDocx'
import { importPdf } from '../utils/importPdf'

const AlignableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      textAlign: {
        default: 'center',
        parseHTML: (element) => element.getAttribute('data-text-align') || 'center',
        renderHTML: (attributes) => ({ 'data-text-align': attributes.textAlign }),
      },
    }
  },
})

export default function Editor() {
  const [activeTemplate, setActiveTemplate] = useState<string>('internalMemo')
  const [importWarnings, setImportWarnings] = useState<string[]>([])
  const [showImportMenu, setShowImportMenu] = useState<boolean>(false)
  const [exporting, setExporting] = useState<'PDF' | 'DOCX' | null>(null)
  const [margins, setMargins] = useState<PageMargins>({ ...DOCUMENT_PAGE_SPEC.defaultMargins })
  const [pdfMode, setPdfMode] = useState(false)
  const [pdfPages, setPdfPages] = useState<PdfPageData[]>([])
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null)
  const [pageCount, setPageCount] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const pageRef = useRef<HTMLDivElement>(null)
  const pageCountRef = useRef(1)
  const paginationSignatureRef = useRef('')

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      AlignableImage.configure({
        inline: false,
        allowBase64: true,
        resize: {
          enabled: true,
          directions: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
          minWidth: 50,
          minHeight: 50,
          alwaysPreserveAspectRatio: true,
        },
      }),
      Highlight,
      Underline,
      Placeholder.configure({ placeholder: 'เริ่มพิมพ์เอกสาร...' }),
      TextStyle,
      FontFamily,
      FontSize,
      Color,
      PaginationState,
    ],
    content: templates.internalMemo.content,
    editorProps: { attributes: { class: 'document-content' } },
  })

  const getPaginatedHtml = useCallback(() => {
    if (!editor) return ''
    const clone = editor.view.dom.cloneNode(true) as HTMLElement
    clone.querySelectorAll<HTMLElement>('[data-page-break-before="true"]').forEach((element) => {
      element.style.removeProperty('--page-break-offset')
      element.style.removeProperty('--page-original-padding')
    })
    const liveImageContainers = editor.view.dom.querySelectorAll<HTMLElement>(
      '[data-resize-container][data-node="image"]',
    )
    clone.querySelectorAll<HTMLElement>('[data-resize-container][data-node="image"]').forEach((container, index) => {
      const image = container.querySelector<HTMLImageElement>('img')
      if (image) {
        const liveImage = liveImageContainers[index]?.querySelector<HTMLImageElement>('img')
        if (liveImage) {
          const bounds = liveImage.getBoundingClientRect()
          if (bounds.width > 0 && bounds.height > 0) {
            const width = Math.round(bounds.width * 100) / 100
            const height = Math.round(bounds.height * 100) / 100
            image.setAttribute('width', String(width))
            image.setAttribute('height', String(height))
            image.style.width = `${width}px`
            image.style.height = `${height}px`
          }
        }
        const wrapper = document.createElement('div')
        wrapper.className = 'image-export'
        const textAlign = image.getAttribute('data-text-align')
        wrapper.style.textAlign = textAlign === 'left' || textAlign === 'right'
          ? textAlign
          : 'center'
        wrapper.appendChild(image)
        container.replaceWith(wrapper)
      }
    })
    clone.querySelectorAll('.page-flow-break').forEach((element) => element.remove())
    return clone.innerHTML
  }, [editor])

  const switchTemplate = useCallback(
    (key: string) => {
      if (!editor) return
      setActiveTemplate(key)
      setImportWarnings([])
      editor.commands.setContent(templates[key].content)
    },
    [editor]
  )

  const handleExport = useCallback(async (format: 'PDF' | 'DOCX') => {
    if (!editor || exporting) return
    setExporting(format)
    try {
      const html = getPaginatedHtml()
      const filename = `${activeTemplate}.${format.toLowerCase()}`
      if (format === 'PDF') {
        await exportToPdf({ html, filename, margins })
      } else {
        await exportToDocx({ html, filename, margins })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown export error'
      window.alert(`ไม่สามารถ Export ${format} ได้\n${message}`)
    } finally {
      setExporting(null)
    }
  }, [editor, exporting, getPaginatedHtml, activeTemplate, margins])

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

  const handleExitPdfMode = useCallback(() => {
    setPdfMode(false)
    setPdfPages([])
    setPdfData(null)
  }, [])

  useEffect(() => {
    if (!editor) return

    let isPaginating = false

    const paginate = () => {
      const page = pageRef.current
      const content = page?.querySelector<HTMLElement>('.document-content')
      if (!page || !content || isPaginating || document.fonts?.status === 'loading') return
      isPaginating = true

      const pageWidth = page.getBoundingClientRect().width
      const pixelsPerCentimeter = pageWidth / DOCUMENT_PAGE_SPEC.widthCm
      const pageHeight = DOCUMENT_PAGE_SPEC.heightCm * pixelsPerCentimeter
      const marginTop = margins.top * pixelsPerCentimeter
      const marginBottom = margins.bottom * pixelsPerCentimeter

      content.classList.add('measuring-layout')
      let lineMeasurements
      try {
        lineMeasurements = measureDocumentLines(
          content,
          (node, offset) => editor.view.posAtDOM(node, offset),
        )
      } finally {
        content.classList.remove('measuring-layout')
      }

      const usableHeight = pageHeight - marginTop - marginBottom
      const pageLayouts = buildPageLayouts(lineMeasurements, usableHeight)
      const pageBreaks = buildPageBreakDecorations(
        pageLayouts,
        usableHeight,
        marginTop,
        marginBottom,
        DOCUMENT_PAGE_SPEC.gapPx,
      )
      const nextPageCount = Math.max(1, pageLayouts.length)
      pageCountRef.current = nextPageCount
      setPageCount(nextPageCount)
      setCurrentPage((value) => Math.min(value, nextPageCount))

      const signature = `${pageLayoutSignature(pageLayouts)}:${JSON.stringify(pageBreaks)}`
      if (signature !== paginationSignatureRef.current) {
        paginationSignatureRef.current = signature
        setPageBreaks(editor, pageBreaks)
      }
      isPaginating = false
    }

    const updateCurrentPage = () => {
      const page = pageRef.current
      if (!page) return
      try {
        const caret = editor.view.coordsAtPos(editor.state.selection.head)
        const pageTop = page.getBoundingClientRect().top
        const pageHeight = page.getBoundingClientRect().width * (DOCUMENT_PAGE_SPEC.heightCm / DOCUMENT_PAGE_SPEC.widthCm)
        const nextPage = Math.floor(Math.max(0, caret.top - pageTop) / (pageHeight + DOCUMENT_PAGE_SPEC.gapPx)) + 1
        setCurrentPage(Math.min(Math.max(1, nextPage), pageCountRef.current))
      } catch {
        setCurrentPage(1)
      }
    }

    let frame = 0
    const scheduleRecalculation = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        paginate()
        updateCurrentPage()
      })
    }
    const content = pageRef.current?.querySelector<HTMLElement>('.document-content')
    const resizeObserver = new ResizeObserver(scheduleRecalculation)
    if (content) resizeObserver.observe(content)
    editor.on('update', scheduleRecalculation)
    editor.on('selectionUpdate', updateCurrentPage)
    void document.fonts?.ready.then(scheduleRecalculation)
    scheduleRecalculation()

    return () => {
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      editor.off('update', scheduleRecalculation)
      editor.off('selectionUpdate', updateCurrentPage)
    }
  }, [editor, margins])

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
        </div>
      )}

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
          className="page a4-page canonical-page-renderer"
          style={{
            width: `${DOCUMENT_PAGE_SPEC.widthCm}cm`,
            minHeight: `calc(${pageCount * DOCUMENT_PAGE_SPEC.heightCm}cm + ${(pageCount - 1) * DOCUMENT_PAGE_SPEC.gapPx}px)`,
            paddingTop: `${margins.top}cm`,
            paddingBottom: `${margins.bottom}cm`,
            paddingLeft: `${margins.left}cm`,
            paddingRight: `${margins.right}cm`,
            fontFamily: DOCUMENT_PAGE_SPEC.typography.fontFamily,
            fontSize: `${DOCUMENT_PAGE_SPEC.typography.fontSizePt}pt`,
            lineHeight: `${DOCUMENT_PAGE_SPEC.typography.lineHeightPt}pt`,
          }}
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
