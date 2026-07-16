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
import { DOCUMENT_PAGE_SPEC } from '../pageSpec'
import {
  findLineBreakIndex,
  markCandidateBreak,
  measureDocumentLines,
  type BlockLineMeasurement,
} from '../lineMeasurement'
import {
  buildPageBreakDecorations,
  buildPageLayouts,
  pageLayoutSignature,
  type PaginationPluginState,
} from '../paginationModel'
import {
  getPaginationState,
  PaginationState,
  setPaginationLayout,
} from '../extensions/paginationState'
import { templates } from '../templates/index'
import { exportToDocx } from '../utils/exportDocx'
import { exportToPdf } from '../utils/exportPdf'
import { importDocx } from '../utils/importDocx'
import { importPdf } from '../utils/importPdf'

interface EditorProps {
  onLineMeasurements?: (measurements: BlockLineMeasurement[]) => void
  persistPagination?: boolean
  renderPageSheets?: boolean
  onPaginationState?: (state: PaginationPluginState) => void
}

export default function Editor({
  onLineMeasurements,
  persistPagination = false,
  renderPageSheets = false,
  onPaginationState,
}: EditorProps = {}) {
  const [activeTemplate, setActiveTemplate] = useState<string>('internalMemo')
  const [importWarnings, setImportWarnings] = useState<string[]>([])
  const [showImportMenu, setShowImportMenu] = useState<boolean>(false)
  const [margins, setMargins] = useState<PageMargins>({ ...DOCUMENT_PAGE_SPEC.defaultMargins })
  const [signatures, setSignatures] = useState<SignatureData[]>([])
  const [pdfMode, setPdfMode] = useState(false)
  const [pdfPages, setPdfPages] = useState<PdfPageData[]>([])
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null)
  const [pageCount, setPageCount] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const pageRef = useRef<HTMLDivElement>(null)
  const pageCountRef = useRef(1)
  const measurementSignatureRef = useRef('')
  const paginationSignatureRef = useRef('')

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
      ...(persistPagination || renderPageSheets ? [PaginationState] : []),
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

  const handleExportDocx = useCallback(() => {
    if (!editor) return
    const html = getPaginatedHtml()
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
  }, [editor, getPaginatedHtml, activeTemplate, signatures, margins])

  const handleExportPdf = useCallback(() => {
    if (!editor) return
    const html = getPaginatedHtml()
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
  }, [editor, getPaginatedHtml, activeTemplate, signatures, margins])

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

    let isPaginating = false

    const paginate = () => {
      const page = pageRef.current
      const content = page?.querySelector<HTMLElement>('.document-content')
      if (!page || !content || isPaginating || document.fonts?.status === 'loading') return
      isPaginating = true

      const pageWidth = page.getBoundingClientRect().width
      const pixelsPerCentimeter = pageWidth / DOCUMENT_PAGE_SPEC.widthCm
      const pageHeight = DOCUMENT_PAGE_SPEC.heightCm * pixelsPerCentimeter
      const pageStride = pageHeight + DOCUMENT_PAGE_SPEC.gapPx
      const marginTop = margins.top * pixelsPerCentimeter
      const marginBottom = margins.bottom * pixelsPerCentimeter
      const blocks = Array.from(content.children) as HTMLElement[]

      blocks.forEach((block) => {
        block.removeAttribute('data-page-break-before')
        block.style.removeProperty('--page-break-offset')
        block.style.removeProperty('--page-original-padding')
      })

      const shouldMeasureLines = Boolean(onLineMeasurements || persistPagination || renderPageSheets)
      content.classList.add('measuring-layout')
      let lineMeasurements: BlockLineMeasurement[] = []
      try {
        lineMeasurements = shouldMeasureLines
          ? measureDocumentLines(content, (node, offset) => editor.view.posAtDOM(node, offset))
          : []
      } finally {
        content.classList.remove('measuring-layout')
      }

      let pageIndex = 0
      if (!renderPageSheets) for (const [blockIndex, block] of blocks.entries()) {
        let blockTop = content.offsetTop + block.offsetTop
        let blockHeight = block.getBoundingClientRect().height
        let contentBottom = pageIndex * pageStride + pageHeight - marginBottom

        if (blockTop + blockHeight > contentBottom && blockTop > marginTop) {
          const measurement = lineMeasurements[blockIndex]
          if (measurement) {
            const candidate = measurement.unsplittable
              ? 0
              : findLineBreakIndex(measurement.lines, contentBottom - blockTop) ?? 0
            lineMeasurements[blockIndex] = markCandidateBreak(measurement, candidate)
          }

          pageIndex += 1
          const nextPageTop = pageIndex * pageStride + marginTop
          const originalPadding = Number.parseFloat(getComputedStyle(block).paddingTop) || 0
          block.setAttribute('data-page-break-before', 'true')
          block.style.setProperty('--page-original-padding', `${originalPadding}px`)
          block.style.setProperty(
            '--page-break-offset',
            `${Math.max(0, nextPageTop - blockTop - originalPadding)}px`,
          )
          blockTop = content.offsetTop + block.offsetTop
          blockHeight = block.getBoundingClientRect().height
          contentBottom = pageIndex * pageStride + pageHeight - marginBottom
        }

        while (blockTop + blockHeight > contentBottom + pageHeight) {
          pageIndex += 1
          contentBottom = pageIndex * pageStride + pageHeight - marginBottom
        }
      }

      const pageLayouts = persistPagination
        ? buildPageLayouts(lineMeasurements, pageHeight - marginTop - marginBottom)
        : []
      const pageBreaks = renderPageSheets
        ? buildPageBreakDecorations(
            pageLayouts,
            pageHeight - marginTop - marginBottom,
            marginTop,
            marginBottom,
            DOCUMENT_PAGE_SPEC.gapPx,
          )
        : []
      const nextPageCount = persistPagination
        ? Math.max(1, pageLayouts.length)
        : Math.max(1, pageIndex + 1)
      pageCountRef.current = nextPageCount
      setPageCount(nextPageCount)
      setCurrentPage((value) => Math.min(value, nextPageCount))

      if (onLineMeasurements) {
        const signature = lineMeasurements
          .map((block) => `${block.lines.length}:${block.candidateBreakLineIndex ?? '-'}`)
          .join('|')
        if (signature !== measurementSignatureRef.current) {
          measurementSignatureRef.current = signature
          onLineMeasurements(lineMeasurements)
        }
      }

      if (persistPagination) {
        const signature = `${pageLayoutSignature(pageLayouts)}:${JSON.stringify(pageBreaks)}`
        if (signature !== paginationSignatureRef.current) {
          paginationSignatureRef.current = signature
          setPaginationLayout(editor, pageLayouts, pageBreaks)
          onPaginationState?.(getPaginationState(editor))
        }
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
  }, [editor, margins, onLineMeasurements, onPaginationState, persistPagination, renderPageSheets])

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
          className={`page a4-page ${renderPageSheets ? 'canonical-page-renderer' : ''}`}
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
          <div className={`page-sheets ${renderPageSheets ? 'canonical-page-sheets' : ''}`} aria-hidden="true">
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
