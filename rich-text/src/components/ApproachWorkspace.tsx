import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Circle, FlaskConical, Gauge, Home, Route } from 'lucide-react'
import type { LayoutApproach } from '../layoutApproaches'
import Editor from './Editor'

const reviewItems = ['Font', 'Paragraph', 'Line Height', 'Table', 'Image', 'Margin', 'Page Break', 'Header / Footer']

export default function ApproachWorkspace({ approach }: { approach: LayoutApproach }) {
  const [checkedItems, setCheckedItems] = useState<string[]>([])
  const [fontWidth, setFontWidth] = useState<number | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (approach.number !== 8) return
    const context = canvasRef.current?.getContext('2d')
    if (!context) return
    context.font = '16pt "TH Sarabun New"'
    setFontWidth(Math.round(context.measureText('ทดสอบ Layout Engine').width * 100) / 100)
  }, [approach.number])

  const toggleReviewItem = (item: string) => {
    setCheckedItems((items) => items.includes(item) ? items.filter((value) => value !== item) : [...items, item])
  }

  return (
    <section className="approach-workspace">
      <div className="approach-overview no-print">
        <div className="approach-title-row">
          <span className="approach-number">{String(approach.number).padStart(2, '0')}</span>
          <div>
            <div className="approach-eyebrow"><FlaskConical size={14} /> Layout Engine Lab</div>
            <h1>{approach.title}</h1>
            <p>{approach.summary}</p>
          </div>
        </div>

        <div className="approach-comparison">
          <article><div className="approach-card-label"><Home size={15} /> ต่างจาก Home</div><p>{approach.difference}</p></article>
          <article><div className="approach-card-label"><Gauge size={15} /> ปัญหาที่แก้</div><p>{approach.problem}</p></article>
          <article><div className="approach-card-label"><Route size={15} /> วิธีทดลอง</div><ol>{approach.implementation.map((step) => <li key={step}>{step}</li>)}</ol></article>
        </div>

        <div className="approach-pros-cons">
          <article><h2>ข้อดี</h2><ul>{approach.benefits.map((item) => <li key={item}>{item}</li>)}</ul></article>
          <article><h2>ข้อจำกัด</h2><ul>{approach.limitations.map((item) => <li key={item}>{item}</li>)}</ul></article>
        </div>

        {approach.number === 8 && (
          <div className="approach-instrument"><canvas ref={canvasRef} width="1" height="1" /><strong>Canvas measurement:</strong> “ทดสอบ Layout Engine” = {fontWidth ?? '...'} px</div>
        )}

        {approach.number === 15 && (
          <div className="approach-checklist">
            {reviewItems.map((item) => (
              <button type="button" key={item} onClick={() => toggleReviewItem(item)} className={checkedItems.includes(item) ? 'checked' : ''}>
                {checkedItems.includes(item) ? <CheckCircle2 size={17} /> : <Circle size={17} />}{item}
              </button>
            ))}
          </div>
        )}

        <div className="sandbox-label"><span>Isolated Editor Sandbox</span><small>เริ่มจาก Home baseline และ mount state ใหม่สำหรับวิธีนี้</small></div>
      </div>
      <Editor key={approach.id} />
    </section>
  )
}
