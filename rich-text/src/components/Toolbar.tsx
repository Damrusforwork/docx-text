import type { ReactNode } from 'react'
import type { Editor } from '@tiptap/react'
import { useCallback, useState, useEffect, useRef } from 'react'
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

const LINE_HEIGHT_OPTIONS = [1, 1.15, 1.5, 2]

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
  const imageInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!editor) return
    const handler = () => {
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name !== 'image') return
        const dom = editor.view.nodeDOM(pos)
        const image = dom instanceof HTMLImageElement
          ? dom
          : dom instanceof HTMLElement
            ? dom.querySelector('img')
            : null
        image?.setAttribute('data-text-align', node.attrs.textAlign || 'center')
      })
      forceUpdate((n) => n + 1)
    }
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

  const importImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        editor.chain().focus().setImage({ src: reader.result, alt: file.name }).run()
      }
    }
    reader.onerror = () => window.alert('ไม่สามารถอ่านไฟล์รูปภาพได้')
    reader.readAsDataURL(file)
  }

  const rawFontFamily = readCurrentFontFamily(editor)
  const currentFontFamily = matchFontFamily(rawFontFamily)
  const currentFontSize = readCurrentFontSize(editor)
  const activeTextBlock = editor.isActive('heading') ? 'heading' : 'paragraph'
  const currentLineHeight = String(editor.getAttributes(activeTextBlock).lineHeight || 1.5)
  const selectedColor = editor.getAttributes('textStyle').color
  const currentTextColor = /^#[0-9a-f]{6}$/i.test(selectedColor) ? selectedColor : '#000000'
  const imageSelected = editor.isActive('image')
  const setAlignment = (textAlign: 'left' | 'center' | 'right' | 'justify') => {
    const chain = editor.chain().focus()
    if (imageSelected) {
      if (textAlign !== 'justify') chain.updateAttributes('image', { textAlign }).run()
    } else {
      if (editor.isActive('paragraph')) chain.updateAttributes('paragraph', { marginLeft: null })
      chain.setTextAlign(textAlign).run()
    }
  }
  const isAlignmentActive = (textAlign: 'left' | 'center' | 'right') => (
    imageSelected
      ? editor.getAttributes('image').textAlign === textAlign
      : editor.isActive({ textAlign })
  )

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
        <div className="line-height-dropdown">
          <input
            key={currentLineHeight}
            type="text"
            defaultValue={currentLineHeight}
            inputMode="decimal"
            autoComplete="off"
            placeholder="Spacing"
            onBlur={(event) => {
              const applied = editor.commands.setLineHeight(event.currentTarget.value)
              if (!applied) event.currentTarget.value = currentLineHeight
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur()
            }}
            title={`ระยะห่างระหว่างบรรทัด: ${currentLineHeight}`}
            aria-label="กรอกระยะห่างระหว่างบรรทัด"
          />
          <select
            value=""
            onChange={(event) => {
              editor.chain().focus().setLineHeight(event.currentTarget.value).run()
            }}
            title="เลือกค่าระยะห่างระหว่างบรรทัด"
            aria-label="เลือกค่าระยะห่างระหว่างบรรทัด"
          >
            <option value="" disabled>Spacing</option>
            {LINE_HEIGHT_OPTIONS.map((lineHeight) => (
              <option key={lineHeight} value={String(lineHeight)}>
                {lineHeight}
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
        <label className="text-color-picker" title="สีตัวอักษร">
          <span style={{ borderBottomColor: currentTextColor }}>A</span>
          <input
            type="color"
            value={currentTextColor}
            onChange={(event) => editor.chain().focus().setColor(event.target.value).run()}
            aria-label="เลือกสีตัวอักษร"
          />
        </label>
      </div>

      <ToolbarDivider />

      <div className="toolbar-group">
        <ToolbarButton
          onClick={() => setAlignment('left')}
          isActive={isAlignmentActive('left')}
          title="ชิดซ้าย"
        >
          <AlignLeft size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => setAlignment('center')}
          isActive={isAlignmentActive('center')}
          title="กึ่งกลาง"
        >
          <AlignCenter size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => setAlignment('right')}
          isActive={isAlignmentActive('right')}
          title="ชิดขวา"
        >
          <AlignRight size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => setAlignment('justify')}
          isActive={editor.isActive({ textAlign: 'justify' })}
          disabled={imageSelected}
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
        <ToolbarButton onClick={() => imageInputRef.current?.click()} title="นำเข้ารูปภาพจากเครื่อง">
          <ImagePlus size={16} />
        </ToolbarButton>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/png,image/jpeg"
          onChange={importImage}
          hidden
        />
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
