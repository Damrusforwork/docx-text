import { useCallback, useState } from 'react'
import { AlignJustify, ScanLine, SplitSquareVertical } from 'lucide-react'
import type { BlockLineMeasurement } from '../lineMeasurement'
import Editor from './Editor'

export default function LineMeasurementWorkspace() {
  const [measurements, setMeasurements] = useState<BlockLineMeasurement[]>([])
  const handleMeasurements = useCallback((next: BlockLineMeasurement[]) => setMeasurements(next), [])
  const lineCount = measurements.reduce((total, block) => total + block.lines.length, 0)
  const candidates = measurements.filter((block) => block.candidateBreakLineIndex !== null)
  const atomicBlocks = measurements.filter((block) => block.unsplittable).length

  return (
    <section className="approach-workspace">
      <div className="approach-overview no-print">
        <div className="approach-title-row">
          <span className="approach-number">P2</span>
          <div>
            <div className="approach-eyebrow"><ScanLine size={14} /> Canonical Layout</div>
            <h1>Phase 2 · Line Measurement</h1>
            <p>วัดตำแหน่งบรรทัดจริงด้วย Range API หลังฟอนต์โหลด พร้อมคำนวณจุดตัดตามกฎ widow/orphan</p>
          </div>
        </div>

        <div className="approach-comparison">
          <article>
            <div className="approach-card-label"><AlignJustify size={15} /> Measured</div>
            <p>{measurements.length} blocks · {lineCount} visual lines</p>
          </article>
          <article>
            <div className="approach-card-label"><SplitSquareVertical size={15} /> Break candidates</div>
            <p>{candidates.length} blocks cross an A4 content boundary</p>
          </article>
          <article>
            <div className="approach-card-label"><ScanLine size={15} /> Atomic content</div>
            <p>{atomicBlocks} table/image/rule blocks cannot split</p>
          </article>
        </div>

        <div className="approach-instrument">
          <strong>Candidate report:</strong>{' '}
          {candidates.length
            ? candidates.map((block) => `#${block.blockIndex + 1} ${block.tagName}: line ${Number(block.candidateBreakLineIndex) + 1}`).join(' · ')
            : 'No line-level page break is currently required.'}
        </div>

        <div className="sandbox-label">
          <span>Phase 2 Editor Sandbox</span>
          <small>Instrumentation only · persistence starts in Phase 3</small>
        </div>
      </div>
      <Editor onLineMeasurements={handleMeasurements} />
    </section>
  )
}
