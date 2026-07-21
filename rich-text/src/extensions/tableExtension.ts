import { Table, TableView } from '@tiptap/extension-table'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { EditorView } from '@tiptap/pm/view'

export type TableAlignment = 'left' | 'center' | 'right'

class DraggableTableView extends TableView {
  private readonly dragHandle: HTMLButtonElement

  constructor(
    node: ProseMirrorNode,
    cellMinWidth: number,
    view?: EditorView,
    HTMLAttributes: Record<string, unknown> = {},
  ) {
    super(node, cellMinWidth, view, HTMLAttributes)
    this.dragHandle = document.createElement('button')
    this.dragHandle.type = 'button'
    this.dragHandle.className = 'table-drag-handle'
    this.dragHandle.contentEditable = 'false'
    this.dragHandle.draggable = true
    this.dragHandle.title = 'ลากเพื่อย้ายตาราง'
    this.dragHandle.setAttribute('aria-label', 'ลากเพื่อย้ายตาราง')
    this.dragHandle.textContent = '⋮⋮'
    this.dom.insertBefore(this.dragHandle, this.table)
    this.applyAlignment(node)
  }

  update(node: ProseMirrorNode) {
    const updated = super.update(node)
    if (updated) this.applyAlignment(node)
    return updated
  }

  private applyAlignment(node: ProseMirrorNode) {
    this.table.dataset.tableAlign = node.attrs.tableAlign || 'left'
  }
}

export const TableExtension = Table.extend({
  draggable: true,

  addAttributes() {
    return {
      ...this.parent?.(),
      tableAlign: {
        default: 'left',
        parseHTML: (element) => element.getAttribute('data-table-align') || 'left',
        renderHTML: (attributes) => ({ 'data-table-align': attributes.tableAlign }),
      },
    }
  },
}).configure({
  resizable: true,
  View: DraggableTableView,
})
