import { Color } from '@tiptap/extension-color'
import { FontFamily } from '@tiptap/extension-font-family'
import { Highlight } from '@tiptap/extension-highlight'
import { Placeholder } from '@tiptap/extension-placeholder'
import { Table } from '@tiptap/extension-table'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableRow } from '@tiptap/extension-table-row'
import { TextAlign } from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import { Underline } from '@tiptap/extension-underline'
import { useEditor } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import { migrateDocumentData } from '../documentSchema'
import { FontSize } from '../extensions/fontSize'
import { ImageExtension } from '../extensions/imageExtension'
import { LineHeight } from '../extensions/lineHeight'
import { ParagraphMargin } from '../extensions/paragraphMargin'
import { PaginationState } from '../extensions/paginationState'
import { templates } from '../templates'

export function useDocumentEditor(initialDocument?: unknown) {
  return useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      ImageExtension,
      Highlight,
      Underline,
      Placeholder.configure({ placeholder: 'เริ่มพิมพ์เอกสาร...' }),
      TextStyle,
      FontFamily,
      FontSize,
      LineHeight,
      ParagraphMargin,
      Color,
      PaginationState,
    ],
    content: initialDocument === undefined
      ? templates.internalMemo.html
      : migrateDocumentData(initialDocument).content,
    editorProps: { attributes: { class: 'document-content' } },
  })
}
