import { useState, useRef, useEffect } from 'react'
import { Ruler } from 'lucide-react'
import type { DocumentMargins } from '../pageSpec'

export type PageMargins = DocumentMargins

interface PageMarginRulerProps {
  margins: PageMargins
  onChange: (margins: PageMargins) => void
}

const PRESETS: { label: string; value: PageMargins }[] = [
  { label: 'ราชการ', value: { top: 2.5, bottom: 2.5, left: 3, right: 1.5 } },
  { label: 'มาตรฐาน', value: { top: 2.54, bottom: 2.54, left: 2.54, right: 2.54 } },
  { label: 'แคบ', value: { top: 1.27, bottom: 1.27, left: 1.27, right: 1.27 } },
  { label: 'กว้าง', value: { top: 2, bottom: 2, left: 3.5, right: 2 } },
]

export default function PageMarginRuler({ margins, onChange }: PageMarginRulerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [dragging, setDragging] = useState<string | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!dragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const scale = 0.05
      const delta = e.movementY * scale
      const deltaX = e.movementX * scale

      if (dragging === 'top') {
        onChange({ ...margins, top: Math.max(0, Math.min(5, +(margins.top + delta).toFixed(1))) })
      } else if (dragging === 'bottom') {
        onChange({ ...margins, bottom: Math.max(0, Math.min(5, +(margins.bottom + delta).toFixed(1))) })
      } else if (dragging === 'left') {
        onChange({ ...margins, left: Math.max(0, Math.min(5, +(margins.left + deltaX).toFixed(1))) })
      } else if (dragging === 'right') {
        onChange({ ...margins, right: Math.max(0, Math.min(5, +(margins.right - deltaX).toFixed(1))) })
      }
    }

    const handleMouseUp = () => setDragging(null)

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragging, margins, onChange])

  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    window.addEventListener('mousedown', handleClickOutside)
    return () => window.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  return (
    <div className="margin-ruler-wrapper">
      <button
        className="toolbar-btn margin-ruler-toggle"
        onClick={() => setIsOpen(!isOpen)}
        title="ปรับขนาดขอบกระดาษ"
      >
        <Ruler size={16} />
      </button>

      {isOpen && (
        <div className="margin-ruler-panel" ref={panelRef}>
          <div className="margin-ruler-header">Page Margins (cm)</div>

          <div className="margin-ruler-page">
            <div
              className="margin-edge margin-top"
              onMouseDown={() => setDragging('top')}
              title={`Top: ${margins.top}cm`}
            >
              <div className="margin-ruler-track">
                {Array.from({ length: 26 }, (_, i) => (
                  <span key={i} className={`margin-tick ${i % 5 === 0 ? 'major' : ''}`} />
                ))}
              </div>
              <span className="margin-label">{margins.top}</span>
            </div>

            <div className="margin-middle">
              <div
                className="margin-edge margin-left"
                onMouseDown={() => setDragging('left')}
                title={`Left: ${margins.left}cm`}
              >
                <div className="margin-ruler-track vertical">
                  {Array.from({ length: 21 }, (_, i) => (
                    <span key={i} className={`margin-tick ${i % 5 === 0 ? 'major' : ''}`} />
                  ))}
                </div>
                <span className="margin-label vertical">{margins.left}</span>
              </div>

              <div className="margin-page-content">
                <span className="margin-page-label">A4</span>
              </div>

              <div
                className="margin-edge margin-right"
                onMouseDown={() => setDragging('right')}
                title={`Right: ${margins.right}cm`}
              >
                <span className="margin-label vertical">{margins.right}</span>
                <div className="margin-ruler-track vertical">
                  {Array.from({ length: 21 }, (_, i) => (
                    <span key={i} className={`margin-tick ${i % 5 === 0 ? 'major' : ''}`} />
                  ))}
                </div>
              </div>
            </div>

            <div
              className="margin-edge margin-bottom"
              onMouseDown={() => setDragging('bottom')}
              title={`Bottom: ${margins.bottom}cm`}
            >
              <span className="margin-label">{margins.bottom}</span>
              <div className="margin-ruler-track">
                {Array.from({ length: 26 }, (_, i) => (
                  <span key={i} className={`margin-tick ${i % 5 === 0 ? 'major' : ''}`} />
                ))}
              </div>
            </div>
          </div>

          <div className="margin-presets">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                className="margin-preset-btn"
                onClick={() => onChange(p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="margin-inputs">
            {(['top', 'bottom', 'left', 'right'] as const).map((side) => (
              <label key={side} className="margin-input-group">
                <span>{side}</span>
                <input
                  type="number"
                  min={0}
                  max={5}
                  step={0.1}
                  value={margins[side]}
                  onChange={(e) =>
                    onChange({ ...margins, [side]: parseFloat(e.target.value) || 0 })
                  }
                />
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
