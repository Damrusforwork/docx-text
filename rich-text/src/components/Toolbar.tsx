import type { ReactNode } from 'react'
import type { Editor } from '@tiptap/react'
import { useCallback, useState, useEffect } from 'react'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  ImagePlus,
  Table as TableIcon,
  Heading1,
  Heading2,
  Heading3,
  Undo2,
  Redo2,
  Minus,
  Highlighter,
  RemoveFormatting,
} from 'lucide-react'

const FONT_OPTIONS = [
  { label: 'TH Sarabun New', value: "'TH Sarabun New', sans-serif", displayFont: 'Arial' },
  { label: 'TH Sarabun IT๙', value: "'TH Sarabun IT๙', sans-serif", displayFont: 'Arial' },
  { label: 'TH Sarabun PSK', value: "'TH Sarabun PSK', sans-serif", displayFont: 'Arial' },
  // { label: 'TH Niramit IT๙', value: "'TH Niramit IT๙', sans-serif", displayFont: 'TH Niramit IT๙' },
  { label: 'TH Chakra Petch', value: 'Chakra Petch, sans-serif', displayFont: 'Chakra Petch' },
  { label: 'TH Mitr', value: 'Mitr, sans-serif', displayFont: 'Mitr' },
  { label: 'TH Prompt', value: 'Prompt, sans-serif', displayFont: 'Prompt' },
  { label: 'TH Kanit', value: 'Kanit, sans-serif', displayFont: 'Kanit' },
  { label: 'TH Noto Sans Thai', value: 'Noto Sans Thai, sans-serif', displayFont: 'Noto Sans Thai' },
  { label: 'TH Noto Serif Thai', value: 'Noto Serif Thai, serif', displayFont: 'Noto Serif Thai' },
  { label: 'Arial', value: 'Arial, sans-serif', displayFont: 'Arial' },
  { label: 'Times New Roman', value: 'Times New Roman, serif', displayFont: 'Times New Roman' },
  { label: 'Courier New', value: 'Courier New, monospace', displayFont: 'Courier New' },
]

function matchFontFamily(raw: string): string {
  if (!raw) return ''
  const lower = raw.toLowerCase()
  for (const f of FONT_OPTIONS) {
    if (f.value.toLowerCase() === lower) return f.value
    if (lower.includes(f.displayFont.toLowerCase())) return f.value
  }
  return ''
}

function readCurrentFontSize(editor: Editor): number {
  const { from, to } = editor.state.selection
  let size = 16

  const checkMarksAt = (pos: number) => {
    const nodeAt = editor.state.doc.nodeAt(pos)
    if (nodeAt) {
      nodeAt.marks.forEach((mark) => {
        if (mark.type.name === 'textStyle' && mark.attrs.fontSize) {
          const parsed = parseInt(mark.attrs.fontSize as string)
          if (!isNaN(parsed)) size = parsed
        }
      })
    }
    const $pos = editor.state.doc.resolve(pos)
    $pos.marks().forEach((mark) => {
      if (mark.type.name === 'textStyle' && mark.attrs.fontSize) {
        const parsed = parseInt(mark.attrs.fontSize as string)
        if (!isNaN(parsed)) size = parsed
      }
    })
  }

  checkMarksAt(from)

  if (from !== to) {
    editor.state.doc.nodesBetween(from, to, (node) => {
      node.marks.forEach((mark) => {
        if (mark.type.name === 'textStyle' && mark.attrs.fontSize) {
          const parsed = parseInt(mark.attrs.fontSize as string)
          if (!isNaN(parsed)) size = parsed
        }
      })
    })
  }

  return size
}

function readCurrentFontFamily(editor: Editor): string {
  const { from, to } = editor.state.selection
  let family = ''

  const checkMarksAt = (pos: number) => {
    const nodeAt = editor.state.doc.nodeAt(pos)
    if (nodeAt) {
      nodeAt.marks.forEach((mark) => {
        if (mark.type.name === 'textStyle' && mark.attrs.fontFamily) {
          family = mark.attrs.fontFamily as string
        }
      })
    }
    const $pos = editor.state.doc.resolve(pos)
    $pos.marks().forEach((mark) => {
      if (mark.type.name === 'textStyle' && mark.attrs.fontFamily) {
        family = mark.attrs.fontFamily as string
      }
    })
  }

  checkMarksAt(from)

  if (from !== to) {
    editor.state.doc.nodesBetween(from, to, (node) => {
      node.marks.forEach((mark) => {
        if (mark.type.name === 'textStyle' && mark.attrs.fontFamily) {
          family = mark.attrs.fontFamily as string
        }
      })
    })
  }

  return family
}

interface ToolbarButtonProps {
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
  children: ReactNode
  title?: string
}

function ToolbarButton({ onClick, isActive, disabled, children, title }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`toolbar-btn ${isActive ? 'active' : ''}`}
    >
      {children}
    </button>
  )
}

function ToolbarDivider() {
  return <div className="toolbar-divider" />
}

interface ToolbarProps {
  editor: Editor | null
}

export default function Toolbar({ editor }: ToolbarProps) {
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    if (!editor) return
    const handler = () => forceUpdate((n) => n + 1)
    editor.on('selectionUpdate', handler)
    editor.on('update', handler)
    return () => {
      editor.off('selectionUpdate', handler)
      editor.off('update', handler)
    }
  }, [editor])

  const setFontFamily = useCallback(
    (value: string) => {
      if (!editor) return
      if (!value) {
        editor.chain().focus().unsetFontFamily().run()
      } else {
        editor.chain().focus().setFontFamily(value).run()
      }
    },
    [editor]
  )

  const setFontSize = useCallback(
    (size: number) => {
      if (!editor) return
      if (size <= 0) return
      editor.chain().focus().setFontSize(`${size}pt`).run()
    },
    [editor]
  )

  if (!editor) return null

  const addImage = () => {
    const url = window.prompt('URL ของรูปภาพ:')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  // const addTable = () => {
  //   editor
  //     .chain()
  //     .focus()
  //     .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
  //     .run()
  // }

  const rawFontFamily = readCurrentFontFamily(editor)
  const currentFontFamily = matchFontFamily(rawFontFamily)
  const currentFontSize = readCurrentFontSize(editor)

  const matchedOption = FONT_OPTIONS.find((f) => f.value === currentFontFamily)
  const displayFontName = matchedOption ? matchedOption.displayFont : 'Arial'
  // const displayFontName = matchedOption ? matchedOption.displayFont : 'TH Sarabun New'

  return (
    <div className="toolbar">
      <div className="toolbar-group">
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="เลิกทำ (Undo)"
        >
          <Undo2 size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="ทำซ้ำ (Redo)"
        >
          <Redo2 size={16} />
        </ToolbarButton>
      </div>

      <ToolbarDivider />

      <div className="toolbar-group">
        <div className="font-selector">
          <select
            value={currentFontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            title="เลือก Font"
            style={{ fontFamily: displayFontName }}
          >
            <option value="" style={{ fontFamily: 'Arial, sans-serif' }}>Default</option>
            {FONT_OPTIONS.map((f) => (
              <option key={f.value} value={f.value} style={{ fontFamily: f.displayFont }}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        <div className="font-size-dropdown">
          <select
            value={currentFontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            title={`Font size: ${currentFontSize}pt`}
          >
            {[6, 7, 8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 54, 60, 72, 84, 96].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ToolbarDivider />

      <div className="toolbar-group">
        <ToolbarButton
          onClick={() => editor.chain().focus().setParagraph().run()}
          isActive={editor.isActive('paragraph') && !editor.isActive('heading')}
          title="ข้อความปกติ"
        >
          <span style={{ fontFamily: 'Arial', fontSize: 14, fontWeight: 600 }}>P</span>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          title="หัวข้อ 1"
        >
          <Heading1 size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title="หัวข้อ 2"
        >
          <Heading2 size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          title="หัวข้อ 3"
        >
          <Heading3 size={16} />
        </ToolbarButton>
      </div>

      <ToolbarDivider />

      <div className="toolbar-group">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="ตัวหนา (Bold)"
        >
          <Bold size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="ตัวเอียง (Italic)"
        >
          <Italic size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          title="ขีดเส้นใต้ (Underline)"
        >
          <Underline size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="ขีดฆ่า (Strikethrough)"
        >
          <Strikethrough size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          isActive={editor.isActive('highlight')}
          title="เน้นสี (Highlight)"
        >
          <Highlighter size={16} />
        </ToolbarButton>
      </div>

      <ToolbarDivider />

      <div className="toolbar-group">
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
          title="ชิดซ้าย"
        >
          <AlignLeft size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
          title="กึ่งกลาง"
        >
          <AlignCenter size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
          title="ชิดขวา"
        >
          <AlignRight size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          isActive={editor.isActive({ textAlign: 'justify' })}
          title="จัดเต็มแถว"
        >
          <AlignJustify size={16} />
        </ToolbarButton>
      </div>

      <ToolbarDivider />

      <div className="toolbar-group">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="รายการสัญลักษณ์"
        >
          <List size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="รายการลำดับ"
        >
          <ListOrdered size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="เส้นแนวนอน"
        >
          <Minus size={16} />
        </ToolbarButton>
      </div>

      <ToolbarDivider />

      <div className="toolbar-group">
        <ToolbarButton onClick={addImage} title="แทรกรูปภาพ">
          <ImagePlus size={16} />
        </ToolbarButton>
        {/* <ToolbarButton onClick={addTable} title="แทรกตาราง">
          <TableIcon size={16} />
        </ToolbarButton> */}
      </div>

      <ToolbarDivider />

      <div className="toolbar-group">
        <ToolbarButton
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          title="ล้างการจัดรูปแบบ"
        >
          <RemoveFormatting size={16} />
        </ToolbarButton>
      </div>
    </div>
  )
}
