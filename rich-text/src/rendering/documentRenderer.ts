import type { CSSProperties } from 'react'
import type { Editor } from '@tiptap/react'
import { createDocumentData, type DocumentData } from '../documentSchema'
import { DOCUMENT_PAGE_SPEC, type DocumentMargins } from '../pageSpec'
import type { PageBreakDecoration } from '../paginationModel'
import { buildExportHtml } from '../utils/documentExport'
import { LAYOUT_TOLERANCE } from './layoutTolerance'

export type RenderTarget = 'preview' | 'pdf' | 'docx'

export interface ImageRenderLayout {
  nodeId: string
  widthPx: number
  heightPx: number
  textAlign: 'left' | 'center' | 'right'
  mimeType: string
}

export interface RenderManifest {
  renderVersion: 1
  target: RenderTarget
  schemaVersion: number
  pageCount: number
  pageBreaks: PageBreakDecoration[]
  images: ImageRenderLayout[]
  toleranceVersion: number
}

export interface DocumentRenderResult {
  document: DocumentData
  html: string
  manifest: RenderManifest
}

interface RenderDocumentOptions {
  editor: Editor
  margins: DocumentMargins
  target: Exclude<RenderTarget, 'preview'>
  pageCount: number
  pageBreaks: PageBreakDecoration[]
}

export function buildPreviewPageStyle(
  pageCount: number,
  margins: DocumentMargins,
): CSSProperties {
  return {
    width: `${DOCUMENT_PAGE_SPEC.widthCm}cm`,
    minHeight: `calc(${pageCount * DOCUMENT_PAGE_SPEC.heightCm}cm + ${(pageCount - 1) * DOCUMENT_PAGE_SPEC.gapPx}px)`,
    paddingTop: `${margins.top}cm`,
    paddingBottom: `${margins.bottom}cm`,
    paddingLeft: `${margins.left}cm`,
    paddingRight: `${margins.right}cm`,
    fontFamily: DOCUMENT_PAGE_SPEC.typography.fontFamily,
    fontSize: `${DOCUMENT_PAGE_SPEC.typography.fontSizePt}pt`,
    lineHeight: `${DOCUMENT_PAGE_SPEC.typography.lineHeightPt}pt`,
  }
}

export function renderHtmlForExport(
  html: string,
  margins: DocumentMargins,
  _target: Exclude<RenderTarget, 'preview'>,
) {
  return buildExportHtml({ html, margins })
}

function materializeTableLayouts(root: HTMLElement, liveRoot: HTMLElement) {
  const liveTables = liveRoot.querySelectorAll<HTMLTableElement>('table')

  root.querySelectorAll<HTMLTableElement>('table').forEach((table, tableIndex) => {
    const liveTable = liveTables[tableIndex]
    if (!liveTable) return

    const tableBounds = liveTable.getBoundingClientRect()
    if (tableBounds.width <= 0) return

    const tableWidth = Math.round(tableBounds.width * 100) / 100
    table.style.width = `${tableWidth}px`
    table.style.minWidth = ''
    table.style.tableLayout = 'fixed'
    table.setAttribute('width', String(tableWidth))

    const alignment = liveTable.dataset.tableAlign || table.dataset.tableAlign || 'left'
    table.dataset.tableAlign = alignment
    table.style.marginLeft = alignment === 'left' ? '0' : 'auto'
    table.style.marginRight = alignment === 'right' ? '0' : 'auto'

    const liveColumns = liveTable.querySelectorAll<HTMLTableColElement>('col')
    table.querySelectorAll<HTMLTableColElement>('col').forEach((column, columnIndex) => {
      const width = liveColumns[columnIndex]?.getBoundingClientRect().width || 0
      if (width <= 0) return
      const roundedWidth = Math.round(width * 100) / 100
      column.style.width = `${roundedWidth}px`
      column.style.minWidth = ''
      column.setAttribute('width', String(roundedWidth))
    })

    Array.from(table.rows).forEach((row, rowIndex) => {
      const liveRow = liveTable.rows[rowIndex]
      if (!liveRow) return
      Array.from(row.cells).forEach((cell, cellIndex) => {
        const width = liveRow.cells[cellIndex]?.getBoundingClientRect().width || 0
        if (width <= 0) return
        const roundedWidth = Math.round(width * 100) / 100
        cell.style.width = `${roundedWidth}px`
        cell.setAttribute('width', String(roundedWidth))
      })
    })
  })
}

export function renderDocumentForExport({
  editor,
  margins,
  target,
  pageCount,
  pageBreaks,
}: RenderDocumentOptions): DocumentRenderResult {
  const root = document.createElement('div')
  root.innerHTML = editor.getHTML()
  materializeTableLayouts(root, editor.view.dom)
  const liveImages = editor.view.dom.querySelectorAll<HTMLImageElement>(
    '[data-resize-container][data-node="image"] img',
  )
  const images: ImageRenderLayout[] = []

  root.querySelectorAll<HTMLImageElement>('img').forEach((image, index) => {
    const liveImage = liveImages[index]
    const bounds = liveImage?.getBoundingClientRect()
    const width = bounds?.width || Number(image.getAttribute('width')) || image.width
    const height = bounds?.height || Number(image.getAttribute('height')) || image.height
    if (width > 0 && height > 0) {
      const roundedWidth = Math.round(width * 100) / 100
      const roundedHeight = Math.round(height * 100) / 100
      image.setAttribute('width', String(roundedWidth))
      image.setAttribute('height', String(roundedHeight))
      image.style.width = `${roundedWidth}px`
      image.style.height = `${roundedHeight}px`
    }

    const alignment = image.getAttribute('data-text-align')
    const textAlign = alignment === 'left' || alignment === 'right' ? alignment : 'center'
    const wrapper = document.createElement('div')
    wrapper.className = 'image-export'
    wrapper.style.textAlign = textAlign
    image.replaceWith(wrapper)
    wrapper.appendChild(image)

    images.push({
      nodeId: image.getAttribute('data-layout-id') || `image-${index + 1}`,
      widthPx: Math.round(width * 100) / 100,
      heightPx: Math.round(height * 100) / 100,
      textAlign,
      mimeType: image.src.match(/^data:([^;]+)/)?.[1] || 'application/octet-stream',
    })
  })

  const documentData = createDocumentData(editor.getJSON())
  return {
    document: documentData,
    html: renderHtmlForExport(root.innerHTML, margins, target),
    manifest: {
      renderVersion: 1,
      target,
      schemaVersion: documentData.schemaVersion,
      pageCount,
      pageBreaks: structuredClone(pageBreaks),
      images,
      toleranceVersion: LAYOUT_TOLERANCE.version,
    },
  }
}
