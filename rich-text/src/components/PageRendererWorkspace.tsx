import { useCallback, useState } from 'react'
import { Files, MoveVertical, TextCursorInput } from 'lucide-react'
import type { PaginationPluginState } from '../paginationModel'
import Editor from './Editor'

const EMPTY_STATE: PaginationPluginState = { revision: 0, pages: [], breaks: [] }

export default function PageRendererWorkspace() {
  const [pagination, setPagination] = useState<PaginationPluginState>(EMPTY_STATE)
  const handlePagination = useCallback((state: PaginationPluginState) => setPagination(state), [])

  return (
    <section className="approach-workspace">
      <div className="approach-overview no-print">
        <div className="approach-title-row">
          <span className="approach-number">P4</span>
          <div>
            <div className="approach-eyebrow"><Files size={14} /> Canonical Layout</div>
            <h1>Phase 4 · A4 Page Renderer</h1>
            <p>PageLayout สร้างกระดาษ A4 แยกแผ่นและ page-flow decorations บน ProseMirror surface เดียว</p>
          </div>
        </div>

        <div className="approach-comparison">
          <article>
            <div className="approach-card-label"><Files size={15} /> Sheets</div>
            <p>{pagination.pages.length} canonical A4 containers</p>
          </article>
          <article>
            <div className="approach-card-label"><MoveVertical size={15} /> Flow breaks</div>
            <p>{pagination.breaks.length} model-driven page spacers</p>
          </article>
          <article>
            <div className="approach-card-label"><TextCursorInput size={15} /> Editing surface</div>
            <p>1 ProseMirror instance preserves caret, IME and undo</p>
          </article>
        </div>

        <div className="approach-instrument">
          <strong>Rendered flow:</strong>{' '}
          {pagination.breaks.map((item) => `P${item.pageNumber}@${item.from} +${Math.round(item.heightPx)}px`).join(' · ') || 'Document fits on one A4 sheet.'}
        </div>

        <div className="sandbox-label">
          <span>Phase 4 Editor Sandbox</span>
          <small>Page gap is visual only · export integration starts in Phase 5</small>
        </div>
      </div>
      <Editor persistPagination renderPageSheets onPaginationState={handlePagination} />
    </section>
  )
}
