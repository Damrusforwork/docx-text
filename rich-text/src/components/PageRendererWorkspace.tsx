import { useCallback, useState } from 'react'
import type { PaginationPluginState } from '../paginationModel'
import Editor from './Editor'

const EMPTY_STATE: PaginationPluginState = { revision: 0, pages: [], breaks: [] }

export default function PageRendererWorkspace() {
  const [, setPagination] = useState<PaginationPluginState>(EMPTY_STATE)
  const handlePagination = useCallback((state: PaginationPluginState) => setPagination(state), [])

  return (
    <section className="approach-workspace">
      <Editor persistPagination renderPageSheets onPaginationState={handlePagination} />
    </section>
  )
}
