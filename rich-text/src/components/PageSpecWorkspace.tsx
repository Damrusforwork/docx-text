import { FileOutput, Monitor, Ruler } from 'lucide-react'
import { DOCUMENT_PAGE_SPEC } from '../pageSpec'
import Editor from './Editor'

export default function PageSpecWorkspace() {
  const { widthCm, heightCm, gapPx, defaultMargins, typography } = DOCUMENT_PAGE_SPEC

  return (
    <section className="approach-workspace">
      <div className="approach-overview no-print">
        <div className="approach-title-row">
          <span className="approach-number">P1</span>
          <div>
            <div className="approach-eyebrow"><Ruler size={14} /> Canonical Layout</div>
            <h1>Phase 1 · Shared Page Spec</h1>
            <p>Browser preview และ Export ใช้ค่ากระดาษและ Typography จากแหล่งข้อมูลกลางเดียวกัน</p>
          </div>
        </div>

        <div className="approach-comparison">
          <article>
            <div className="approach-card-label"><Ruler size={15} /> Paper</div>
            <p>{DOCUMENT_PAGE_SPEC.name} · {widthCm} × {heightCm} cm · gap {gapPx}px</p>
          </article>
          <article>
            <div className="approach-card-label"><Monitor size={15} /> Default margins</div>
            <p>บน {defaultMargins.top} · ล่าง {defaultMargins.bottom} · ซ้าย {defaultMargins.left} · ขวา {defaultMargins.right} cm</p>
          </article>
          <article>
            <div className="approach-card-label"><FileOutput size={15} /> Typography</div>
            <p>{typography.fontFamily} · {typography.fontSizePt}pt / {typography.lineHeightPt}pt</p>
          </article>
        </div>

        <div className="sandbox-label">
          <span>Phase 1 Editor Sandbox</span>
          <small>ใช้ Page Spec เดียวกับ Browser, DOCX และ PDF</small>
        </div>
      </div>
      <Editor />
    </section>
  )
}
