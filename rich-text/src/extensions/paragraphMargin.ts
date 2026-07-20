import { Extension } from '@tiptap/core'

export function normalizeParagraphMargin(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const match = value.trim().match(/^(\d+(?:\.\d+)?)%$/)
  if (!match) return null
  const percentage = Number(match[1])
  return percentage <= 100 ? `${percentage}%` : null
}

export const ParagraphMargin = Extension.create({
  name: 'paragraphMargin',

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph'],
        attributes: {
          marginLeft: {
            default: null,
            parseHTML: (element: HTMLElement) => normalizeParagraphMargin(element.style.marginLeft),
            renderHTML: (attributes: Record<string, unknown>) => {
              const marginLeft = normalizeParagraphMargin(attributes.marginLeft)
              return marginLeft ? { style: `margin-left: ${marginLeft}` } : {}
            },
          },
        },
      },
    ]
  },
})
