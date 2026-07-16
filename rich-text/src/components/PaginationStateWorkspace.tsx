import { useCallback, useState } from 'react'
import { Database, Fingerprint, Files } from 'lucide-react'
import type { PaginationPluginState } from '../paginationModel'
import Editor from './Editor'

const EMPTY_STATE: PaginationPluginState = { revision: 0, pages: [], breaks: [] }

export default function PaginationStateWorkspace() {
  const [pagination, setPagination] = useState<PaginationPluginState>(EMPTY_STATE)
  const handlePagination = useCallback((state: PaginationPluginState) => setPagination(state), [])
  const fragments = pagination.pages.flatMap((page) => page.fragments)
  const nodeCount = new Set(fragments.map((fragment) => fragment.nodeId)).size

  return (
    <section className="approach-workspace">
      <div className="approach-overview no-print">
        <div className="approach-title-row">
          <span className="approach-number">P3</span>
          <div>
            <div className="approach-eyebrow"><Database size={14} /> Canonical Layout</div>
            <h1>Phase 3 · Pagination State</h1>
            <p>เก็บ stable node IDs และ PageLayout[] ไว้ใน ProseMirror plugin state ทุกครั้งที่เอกสารจัดหน้าใหม่</p>
          </div>
        </div>

        <div className="approach-comparison">
          <article>
            <div className="approach-card-label"><Database size={15} /> Revision</div>
            <p>{pagination.revision} persisted layout revisions</p>
          </article>
          <article>
            <div className="approach-card-label"><Files size={15} /> Pages</div>
            <p>{pagination.pages.length} pages · {fragments.length} line fragments</p>
          </article>
          <article>
            <div className="approach-card-label"><Fingerprint size={15} /> Stable nodes</div>
            <p>{nodeCount} unique layout IDs</p>
          </article>
        </div>

        <div className="approach-instrument">
          <strong>Page model:</strong>{' '}
          {pagination.pages.map((page) => `P${page.pageNumber}=${page.fragments.length}`).join(' · ') || 'Waiting for layout…'}
        </div>

        <div className="sandbox-label">
          <span>Phase 3 Editor Sandbox</span>
          <small>PageLayout is canonical · multi-sheet rendering starts in Phase 4</small>
        </div>
      </div>
      <Editor persistPagination onPaginationState={handlePagination} />
    </section>
  )
}
