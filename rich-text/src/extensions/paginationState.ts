import { Extension, type Editor } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import type { PageBreakDecoration } from '../paginationModel.ts'

const BLOCK_TYPES = [
  'paragraph',
  'heading',
  'blockquote',
  'bulletList',
  'orderedList',
  'codeBlock',
  'horizontalRule',
  'table',
  'image',
]

const UNIQUE_ID_META = 'paginationLayoutIds'
const PAGINATION_PLUGIN_KEY = new PluginKey<PageBreakDecoration[]>('paginationState')

function createLayoutId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `layout-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function normalizeLayoutIds(
  ids: Array<string | null | undefined>,
  createId: () => string = createLayoutId,
): string[] {
  const seen = new Set<string>()
  return ids.map((id) => {
    let nextId = id
    while (!nextId || seen.has(nextId)) nextId = createId()
    seen.add(nextId)
    return nextId
  })
}

export const PaginationState = Extension.create({
  name: 'paginationState',

  addGlobalAttributes() {
    return [{
      types: BLOCK_TYPES,
      attributes: {
        layoutId: {
          default: null,
          parseHTML: (element: HTMLElement) => element.getAttribute('data-layout-id'),
          renderHTML: (attributes: Record<string, unknown>) => attributes.layoutId
            ? { 'data-layout-id': attributes.layoutId as string }
            : {},
        },
      },
    }]
  },

  addProseMirrorPlugins() {
    return [new Plugin<PageBreakDecoration[]>({
      key: PAGINATION_PLUGIN_KEY,
      state: {
        init: () => [],
        apply: (transaction, value) => {
          return transaction.getMeta(PAGINATION_PLUGIN_KEY) as PageBreakDecoration[] | undefined
            ?? value
        },
      },
      props: {
        decorations: (state) => {
          const breaks = PAGINATION_PLUGIN_KEY.getState(state) ?? []
          const widgets = breaks
            .filter((pageBreak) => pageBreak.from >= 0 && pageBreak.from <= state.doc.content.size)
            .map((pageBreak) => Decoration.widget(pageBreak.from, () => {
              const spacer = document.createElement('span')
              spacer.className = 'page-flow-break'
              spacer.dataset.pageNumber = String(pageBreak.pageNumber)
              spacer.style.height = `${pageBreak.heightPx}px`
              spacer.setAttribute('contenteditable', 'false')
              spacer.setAttribute('aria-hidden', 'true')
              return spacer
            }, {
              key: `page-flow-break-${pageBreak.pageNumber}-${pageBreak.from}`,
              side: -1,
            }))
          return DecorationSet.create(state.doc, widgets)
        },
      },
      appendTransaction: (transactions, _oldState, state) => {
        if (transactions.some((transaction) => transaction.getMeta(UNIQUE_ID_META))) return null

        const nodes: Array<{ offset: number; id: string | null }> = []
        state.doc.forEach((node, offset) => {
          if (BLOCK_TYPES.includes(node.type.name)) {
            nodes.push({ offset, id: (node.attrs.layoutId as string | null) ?? null })
          }
        })
        const normalizedIds = normalizeLayoutIds(nodes.map((node) => node.id))
        const transaction = state.tr
        let changed = false

        nodes.forEach((entry, index) => {
          if (entry.id === normalizedIds[index]) return
          const node = transaction.doc.nodeAt(entry.offset)
          if (!node) return
          transaction.setNodeMarkup(entry.offset, undefined, {
            ...node.attrs,
            layoutId: normalizedIds[index],
          })
          changed = true
        })

        return changed ? transaction.setMeta(UNIQUE_ID_META, true) : null
      },
    })]
  },
})

export function setPageBreaks(
  editor: Editor,
  breaks: PageBreakDecoration[] = [],
) {
  editor.view.dispatch(editor.state.tr.setMeta(PAGINATION_PLUGIN_KEY, breaks))
}
