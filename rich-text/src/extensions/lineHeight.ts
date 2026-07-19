import { Extension } from '@tiptap/core'
import '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    lineHeight: {
      setLineHeight: (lineHeight: string) => ReturnType
      unsetLineHeight: () => ReturnType
    }
  }
}

const LINE_HEIGHT_TYPES = ['paragraph', 'heading']

export function normalizeLineHeight(value: unknown): number | null {
  if (typeof value !== 'number' && typeof value !== 'string') return null
  const lineHeight = Number(value)
  return Number.isFinite(lineHeight) && lineHeight > 0 ? lineHeight : null
}

export const LineHeight = Extension.create({
  name: 'lineHeight',

  addGlobalAttributes() {
    return [
      {
        types: LINE_HEIGHT_TYPES,
        attributes: {
          lineHeight: {
            default: null,
            parseHTML: (element: HTMLElement) => {
              const value = element.style.lineHeight.trim()
              const normalized = normalizeLineHeight(value)
              return normalized === null ? null : String(normalized)
            },
            renderHTML: (attributes: Record<string, unknown>) => {
              const value = normalizeLineHeight(attributes.lineHeight)
              if (value === null) return {}
              return { style: `line-height: ${value}; min-height: ${value}em` }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setLineHeight:
        (lineHeight: string) =>
        ({ commands }) => {
          const value = normalizeLineHeight(lineHeight)
          if (value === null) return false
          const normalized = String(value)
          const paragraphUpdated = commands.updateAttributes('paragraph', { lineHeight: normalized })
          const headingUpdated = commands.updateAttributes('heading', { lineHeight: normalized })
          return paragraphUpdated || headingUpdated
        },
      unsetLineHeight:
        () =>
        ({ commands }) => {
          const paragraphUpdated = commands.updateAttributes('paragraph', { lineHeight: null })
          const headingUpdated = commands.updateAttributes('heading', { lineHeight: null })
          return paragraphUpdated || headingUpdated
        },
    }
  },
})
