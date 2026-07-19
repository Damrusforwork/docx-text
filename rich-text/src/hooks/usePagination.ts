import type { Editor } from '@tiptap/react'
import { useEffect, useRef, useState } from 'react'
import type { PageMargins } from '../components/PageMarginRuler'
import { setPageBreaks } from '../extensions/paginationState'
import { measureDocumentLines } from '../lineMeasurement'
import { DOCUMENT_PAGE_SPEC } from '../pageSpec'
import {
  buildPageBreakDecorations,
  buildPageLayouts,
  pageLayoutSignature,
  type PageBreakDecoration,
} from '../paginationModel'

export function usePagination(editor: Editor | null, margins: PageMargins) {
  const [pageCount, setPageCount] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageBreaks, setLayoutPageBreaks] = useState<PageBreakDecoration[]>([])
  const pageRef = useRef<HTMLDivElement>(null)
  const pageCountRef = useRef(1)
  const paginationSignatureRef = useRef('')

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
        setLayoutPageBreaks(pageBreaks)
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
        const pageHeight = page.getBoundingClientRect().width
          * (DOCUMENT_PAGE_SPEC.heightCm / DOCUMENT_PAGE_SPEC.widthCm)
        const nextPage = Math.floor(
          Math.max(0, caret.top - pageTop) / (pageHeight + DOCUMENT_PAGE_SPEC.gapPx),
        ) + 1
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

  return { pageRef, pageCount, currentPage, pageBreaks }
}
