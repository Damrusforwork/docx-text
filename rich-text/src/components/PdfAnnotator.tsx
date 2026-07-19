import { useCallback, useEffect, useRef, useState } from 'react'
import { Type, ImagePlus, Trash2, FileDown, X } from 'lucide-react'
import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import type { PdfPageData } from '../utils/importPdf'

export interface TextBoxOverlay {
  id: string
  type: 'textbox'
  pageIndex: number
  x: number
  y: number
  width: number
  height: number
  text: string
  fontSize: number
  color: string
  bold: boolean
}

export interface ImageOverlay {
  id: string
  type: 'image'
  pageIndex: number
  x: number
  y: number
  width: number
  height: number
  src: string
}

export type Overlay = TextBoxOverlay | ImageOverlay

interface PdfAnnotatorProps {
  pages: PdfPageData[]
  pdfData: ArrayBuffer
  onExit: () => void
}

let overlayIdCounter = 0
function nextId() {
  return `overlay_${++overlayIdCounter}_${Date.now()}`
}

export default function PdfAnnotator({ pages, pdfData, onExit }: PdfAnnotatorProps) {
  const [overlays, setOverlays] = useState<Overlay[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const pageRefs = useRef<(HTMLDivElement | null)[]>([])

  const addTextBox = useCallback((pageIndex: number) => {
    const newBox: TextBoxOverlay = {
      id: nextId(),
      type: 'textbox',
      pageIndex,
      x: 10,
      y: 10,
      width: 40,
      height: 10,
      text: 'พิมพ์ข้อความ...',
      fontSize: 16,
      color: '#000000',
      bold: false,
    }
    setOverlays((prev) => [...prev, newBox])
    setSelectedId(newBox.id)
  }, [])

  const addImageOverlay = useCallback(
    (pageIndex: number) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = () => {
          const newImg: ImageOverlay = {
            id: nextId(),
            type: 'image',
            pageIndex,
            x: 10,
            y: 10,
            width: 30,
            height: 30,
            src: reader.result as string,
          }
          setOverlays((prev) => [...prev, newImg])
          setSelectedId(newImg.id)
        }
        reader.readAsDataURL(file)
      }
      input.click()
    },
    []
  )

  const updateOverlay = useCallback((id: string, updates: Partial<Overlay>) => {
    setOverlays((prev) => prev.map((o) => (o.id === id ? { ...o, ...updates } as Overlay : o)))
  }, [])

  const removeOverlay = useCallback((id: string) => {
    setOverlays((prev) => prev.filter((o) => o.id !== id))
    setSelectedId((prev) => (prev === id ? null : prev))
  }, [])

  const removeSelected = useCallback(() => {
    if (selectedId) removeOverlay(selectedId)
  }, [selectedId, removeOverlay])

  const handleExportPdf = useCallback(async () => {
    if (exporting) return
    setExporting(true)

    try {
      const pdfDoc = await PDFDocument.load(pdfData)
      pdfDoc.registerFontkit(fontkit)
      const pdfPages = pdfDoc.getPages()

      const fontRegularBytes = await fetch('/fonts/THSarabunNew.ttf').then(r => r.arrayBuffer())
      const fontBoldBytes = await fetch('/fonts/THSarabunNew Bold.ttf').then(r => r.arrayBuffer())
      const regularFont = await pdfDoc.embedFont(fontRegularBytes)
      const boldFont = await pdfDoc.embedFont(fontBoldBytes)

      for (let i = 0; i < pdfPages.length; i++) {
        const page = pdfPages[i]
        const { width: pageWidth, height: pageHeight } = page.getSize()
        const pageOverlays = overlays.filter((o) => o.pageIndex === i)

        for (const overlay of pageOverlays) {
          const x = (overlay.x / 100) * pageWidth
          const y = pageHeight - (overlay.y / 100) * pageHeight - (overlay.height / 100) * pageHeight
          const w = (overlay.width / 100) * pageWidth
          const h = (overlay.height / 100) * pageHeight

          if (overlay.type === 'textbox') {
            const fontSize = overlay.fontSize * 0.75
            const font = overlay.bold ? boldFont : regularFont
            const color = hexToRgb(overlay.color)

            const lines = wrapTextSimple(overlay.text, w, fontSize)
            const lineHeight = fontSize * 1.3

            for (let li = 0; li < lines.length; li++) {
              const textY = y + h - (li + 1) * lineHeight
              if (textY < 0) break
              page.drawText(lines[li], {
                x,
                y: textY,
                size: fontSize,
                font,
                color: rgb(color.r, color.g, color.b),
              })
            }
          } else if (overlay.type === 'image') {
            const imgBytes = await fetch(overlay.src).then(r => r.arrayBuffer())
            let img
            if (overlay.src.includes('image/png')) {
              img = await pdfDoc.embedPng(imgBytes)
            } else {
              img = await pdfDoc.embedJpg(imgBytes)
            }
            page.drawImage(img, {
              x,
              y,
              width: w,
              height: h,
            })
          }
        }
      }

      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'annotated.pdf'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export failed:', err)
      console.error('PDF annotation export failed', err)
      alert('ไม่สามารถส่งออก PDF ที่แก้ไขแล้วได้')
    } finally {
      setExporting(false)
    }
  }, [overlays, pdfData, exporting])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedId) {
        const active = document.activeElement
        if (active && (active.tagName === 'TEXTAREA' || active.tagName === 'INPUT')) return
        removeSelected()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [selectedId, removeSelected])

  return (
    <div className="pdf-annotator" ref={containerRef}>
      <div className="pdf-annotator-toolbar no-print">
        <button className="toolbar-btn export-action" onClick={onExit} title="กลับสู่ Editor">
          <X size={16} />
          <span>ปิด PDF</span>
        </button>

        <div className="toolbar-divider" />

        <button
          className="toolbar-btn export-action"
          onClick={() => {
            const pageIdx = 0
            addTextBox(pageIdx)
          }}
          title="เพิ่มกล่องข้อความหน้าแรก"
        >
          <Type size={16} />
          <span>เพิ่มข้อความ</span>
        </button>

        <button
          className="toolbar-btn export-action"
          onClick={() => {
            addImageOverlay(0)
          }}
          title="วางรูปภาพหน้าแรก"
        >
          <ImagePlus size={16} />
          <span>วางรูปภาพ</span>
        </button>

        {selectedId && (
          <>
            <div className="toolbar-divider" />
            <button
              className="toolbar-btn export-action"
              onClick={removeSelected}
              title="ลบรายการที่เลือก"
            >
              <Trash2 size={16} />
              <span>ลบ</span>
            </button>
          </>
        )}

        <div className="toolbar-divider" />

        <button
          className="toolbar-btn export-action"
          onClick={handleExportPdf}
          disabled={exporting}
          title="Export เป็น PDF"
        >
          <FileDown size={16} />
          <span>{exporting ? 'กำลัง Export...' : 'Export PDF'}</span>
        </button>
      </div>

      <div className="pdf-pages-container">
        {pages.map((page, idx) => (
          <PdfPageView
            key={page.pageNumber}
            page={page}
            pageIndex={idx}
            overlays={overlays.filter((o) => o.pageIndex === idx)}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onUpdate={updateOverlay}
            pageRef={(el) => { pageRefs.current[idx] = el }}
            onAddTextBox={() => addTextBox(idx)}
            onAddImage={() => addImageOverlay(idx)}
          />
        ))}
      </div>
    </div>
  )
}

interface PdfPageViewProps {
  page: PdfPageData
  pageIndex: number
  overlays: Overlay[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onUpdate: (id: string, updates: Partial<Overlay>) => void
  pageRef: (el: HTMLDivElement | null) => void
  onAddTextBox: () => void
  onAddImage: () => void
}

function PdfPageView({
  page,
  overlays,
  selectedId,
  onSelect,
  onUpdate,
  pageRef,
}: PdfPageViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = page.width
    canvas.height = page.height
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(page.canvas, 0, 0)
  }, [page])

  return (
    <div
      className="pdf-page-wrapper"
      ref={pageRef}
      style={{ width: page.width, height: page.height }}
      onClick={(e) => {
        if (e.target === e.currentTarget || e.target === canvasRef.current) {
          onSelect(null)
        }
      }}
    >
      <canvas ref={canvasRef} className="pdf-page-canvas" />

      <div className="pdf-overlay-layer">
        {overlays.map((overlay) =>
          overlay.type === 'textbox' ? (
            <TextBoxItem
              key={overlay.id}
              overlay={overlay}
              isSelected={selectedId === overlay.id}
              onSelect={() => onSelect(overlay.id)}
              onUpdate={(updates) => onUpdate(overlay.id, updates)}
              pageWidth={page.width}
              pageHeight={page.height}
            />
          ) : (
            <ImageItem
              key={overlay.id}
              overlay={overlay}
              isSelected={selectedId === overlay.id}
              onSelect={() => onSelect(overlay.id)}
              onUpdate={(updates) => onUpdate(overlay.id, updates)}
              pageWidth={page.width}
              pageHeight={page.height}
            />
          )
        )}
      </div>
    </div>
  )
}

interface TextBoxItemProps {
  overlay: TextBoxOverlay
  isSelected: boolean
  onSelect: () => void
  onUpdate: (updates: Partial<TextBoxOverlay>) => void
  pageWidth: number
  pageHeight: number
}

function TextBoxItem({ overlay, isSelected, onSelect, onUpdate, pageWidth, pageHeight }: TextBoxItemProps) {
  const [dragging, setDragging] = useState(false)
  const [resizing, setResizing] = useState(false)
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 })
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 })

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      onSelect()
      setDragging(true)
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        ox: overlay.x,
        oy: overlay.y,
      }
    },
    [onSelect, overlay.x, overlay.y]
  )

  const handleResizeDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setResizing(true)
      resizeStart.current = {
        x: e.clientX,
        y: e.clientY,
        w: overlay.width,
        h: overlay.height,
      }
    },
    [overlay.width, overlay.height]
  )

  useEffect(() => {
    if (!dragging) return
    const handleMove = (e: MouseEvent) => {
      const dx = ((e.clientX - dragStart.current.x) / pageWidth) * 100
      const dy = ((e.clientY - dragStart.current.y) / pageHeight) * 100
      onUpdate({
        x: Math.max(0, Math.min(100 - overlay.width, dragStart.current.ox + dx)),
        y: Math.max(0, Math.min(100 - overlay.height, dragStart.current.oy + dy)),
      })
    }
    const handleUp = () => setDragging(false)
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [dragging, onUpdate, overlay.width, overlay.height, pageWidth, pageHeight])

  useEffect(() => {
    if (!resizing) return
    const handleMove = (e: MouseEvent) => {
      const dw = ((e.clientX - resizeStart.current.x) / pageWidth) * 100
      const dh = ((e.clientY - resizeStart.current.y) / pageHeight) * 100
      onUpdate({
        width: Math.max(5, resizeStart.current.w + dw),
        height: Math.max(3, resizeStart.current.h + dh),
      })
    }
    const handleUp = () => setResizing(false)
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [resizing, onUpdate, pageWidth, pageHeight])

  return (
    <div
      className={`pdf-overlay-item pdf-textbox ${isSelected ? 'selected' : ''}`}
      style={{
        left: `${overlay.x}%`,
        top: `${overlay.y}%`,
        width: `${overlay.width}%`,
        height: `${overlay.height}%`,
      }}
      onMouseDown={handleMouseDown}
    >
      <textarea
        className="pdf-textbox-input"
        value={overlay.text}
        onChange={(e) => onUpdate({ text: e.target.value })}
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          fontSize: overlay.fontSize,
          color: overlay.color,
          fontWeight: overlay.bold ? 'bold' : 'normal',
        }}
        placeholder="พิมพ์ข้อความ..."
      />
      {isSelected && (
        <div className="pdf-overlay-resize" onMouseDown={handleResizeDown} />
      )}
    </div>
  )
}

interface ImageItemProps {
  overlay: ImageOverlay
  isSelected: boolean
  onSelect: () => void
  onUpdate: (updates: Partial<ImageOverlay>) => void
  pageWidth: number
  pageHeight: number
}

function ImageItem({ overlay, isSelected, onSelect, onUpdate, pageWidth, pageHeight }: ImageItemProps) {
  const [dragging, setDragging] = useState(false)
  const [resizing, setResizing] = useState(false)
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 })
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 })

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      onSelect()
      setDragging(true)
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        ox: overlay.x,
        oy: overlay.y,
      }
    },
    [onSelect, overlay.x, overlay.y]
  )

  const handleResizeDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setResizing(true)
      resizeStart.current = {
        x: e.clientX,
        y: e.clientY,
        w: overlay.width,
        h: overlay.height,
      }
    },
    [overlay.width, overlay.height]
  )

  useEffect(() => {
    if (!dragging) return
    const handleMove = (e: MouseEvent) => {
      const dx = ((e.clientX - dragStart.current.x) / pageWidth) * 100
      const dy = ((e.clientY - dragStart.current.y) / pageHeight) * 100
      onUpdate({
        x: Math.max(0, Math.min(100 - overlay.width, dragStart.current.ox + dx)),
        y: Math.max(0, Math.min(100 - overlay.height, dragStart.current.oy + dy)),
      })
    }
    const handleUp = () => setDragging(false)
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [dragging, onUpdate, overlay.width, overlay.height, pageWidth, pageHeight])

  useEffect(() => {
    if (!resizing) return
    const handleMove = (e: MouseEvent) => {
      const dw = ((e.clientX - resizeStart.current.x) / pageWidth) * 100
      const dh = ((e.clientY - resizeStart.current.y) / pageHeight) * 100
      onUpdate({
        width: Math.max(5, resizeStart.current.w + dw),
        height: Math.max(5, resizeStart.current.h + dh),
      })
    }
    const handleUp = () => setResizing(false)
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [resizing, onUpdate, pageWidth, pageHeight])

  return (
    <div
      className={`pdf-overlay-item pdf-image-overlay ${isSelected ? 'selected' : ''}`}
      style={{
        left: `${overlay.x}%`,
        top: `${overlay.y}%`,
        width: `${overlay.width}%`,
        height: `${overlay.height}%`,
      }}
      onMouseDown={handleMouseDown}
    >
      <img src={overlay.src} alt="overlay" draggable={false} />
      {isSelected && (
        <div className="pdf-overlay-resize" onMouseDown={handleResizeDown} />
      )}
    </div>
  )
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return { r: 0, g: 0, b: 0 }
  return {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255,
  }
}

function wrapTextSimple(text: string, maxWidth: number, fontSize: number): string[] {
  const avgCharWidth = fontSize * 0.5
  const maxCharsPerLine = Math.floor(maxWidth / avgCharWidth)
  const lines: string[] = []
  let currentLine = ''

  for (const char of text) {
    if (char === '\n') {
      lines.push(currentLine)
      currentLine = ''
    } else if (currentLine.length >= maxCharsPerLine) {
      lines.push(currentLine)
      currentLine = char
    } else {
      currentLine += char
    }
  }
  if (currentLine) lines.push(currentLine)
  return lines
}
