export interface LineToken {
  startOffset: number
  endOffset: number
  text: string
  top: number
  bottom: number
  from?: number
  to?: number
}

export interface LineFragment extends LineToken {
  height: number
  pageBreakBefore: boolean
}

export interface BlockLineMeasurement {
  blockIndex: number
  nodeId: string
  tagName: string
  lines: LineFragment[]
  keepWithNext: boolean
  unsplittable: boolean
  candidateBreakLineIndex: number | null
}

export interface LineBreakRules {
  minOrphanLines: number
  minWidowLines: number
}

export const LINE_BREAK_RULES: LineBreakRules = {
  minOrphanLines: 2,
  minWidowLines: 2,
}

function isSameVisualLine(current: LineFragment, token: LineToken): boolean {
  const overlap = Math.min(current.bottom, token.bottom) - Math.max(current.top, token.top)
  const shortestHeight = Math.min(current.height, token.bottom - token.top)
  return Math.abs(current.top - token.top) <= 1 || overlap >= shortestHeight * 0.5
}

export function groupLineTokens(tokens: LineToken[]): LineFragment[] {
  const lines: LineFragment[] = []

  for (const token of tokens) {
    const current = lines[lines.length - 1]
    if (!current || !isSameVisualLine(current, token)) {
      lines.push({
        ...token,
        height: token.bottom - token.top,
        pageBreakBefore: false,
      })
      continue
    }

    current.startOffset = Math.min(current.startOffset, token.startOffset)
    current.endOffset = Math.max(current.endOffset, token.endOffset)
    current.text += token.text
    current.top = Math.min(current.top, token.top)
    current.bottom = Math.max(current.bottom, token.bottom)
    current.height = current.bottom - current.top
    if (token.from !== undefined) {
      current.from = current.from === undefined ? token.from : Math.min(current.from, token.from)
    }
    if (token.to !== undefined) {
      current.to = current.to === undefined ? token.to : Math.max(current.to, token.to)
    }
  }

  return lines
}

export function findLineBreakIndex(
  lines: LineFragment[],
  remainingHeightPx: number,
  rules: LineBreakRules = LINE_BREAK_RULES,
): number | null {
  if (!lines.length) return null

  const firstLineTop = lines[0].top
  const availableBottom = firstLineTop + Math.max(0, remainingHeightPx)
  const fittingLines = lines.filter((line) => line.bottom <= availableBottom + 0.5).length

  if (fittingLines === lines.length) return null
  if (
    fittingLines < rules.minOrphanLines
    || lines.length - fittingLines < rules.minWidowLines
  ) return 0

  return fittingLines
}

export function markCandidateBreak(
  measurement: BlockLineMeasurement,
  candidateBreakLineIndex: number,
): BlockLineMeasurement {
  return {
    ...measurement,
    candidateBreakLineIndex,
    lines: measurement.lines.map((line, index) => ({
      ...line,
      pageBreakBefore: index === candidateBreakLineIndex,
    })),
  }
}

export function measureDocumentLines(
  content: HTMLElement,
  positionAtDom?: (node: Node, offset: number) => number,
): BlockLineMeasurement[] {
  const contentTop = content.getBoundingClientRect().top
  const Segmenter = (Intl as unknown as {
    Segmenter: new (locale: string, options: { granularity: 'grapheme' }) => {
      segment: (value: string) => Iterable<{ index: number; segment: string }>
    }
  }).Segmenter
  const segmenter = new Segmenter('th', { granularity: 'grapheme' })
  const resolvePosition = (node: Node, offset: number, fallback: number) => {
    if (!positionAtDom) return fallback
    try {
      return positionAtDom(node, offset)
    } catch {
      return fallback
    }
  }

  return Array.from(content.children).map((child, blockIndex) => {
    const block = child as HTMLElement
    const tokens: LineToken[] = []
    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT)
    let blockOffset = 0
    let node = walker.nextNode()

    while (node) {
      const textNode = node as Text
      const value = textNode.data

      for (const part of segmenter.segment(value)) {
        const range = document.createRange()
        const endOffset = part.index + part.segment.length
        range.setStart(textNode, part.index)
        range.setEnd(textNode, endOffset)
        const rect = range.getBoundingClientRect()

        if (rect.height > 0) {
          tokens.push({
            startOffset: blockOffset + part.index,
            endOffset: blockOffset + endOffset,
            text: part.segment,
            top: rect.top - contentTop,
            bottom: rect.bottom - contentTop,
            from: resolvePosition(textNode, part.index, blockOffset + part.index),
            to: resolvePosition(textNode, endOffset, blockOffset + endOffset),
          })
        }
      }

      blockOffset += value.length
      node = walker.nextNode()
    }

    let lines = groupLineTokens(tokens)
    if (!lines.length) {
      const rect = block.getBoundingClientRect()
      lines = [{
        startOffset: 0,
        endOffset: block.textContent?.length ?? 0,
        text: block.textContent ?? '',
        top: rect.top - contentTop,
        bottom: rect.bottom - contentTop,
        height: rect.height,
        pageBreakBefore: false,
        from: resolvePosition(block, 0, 0),
        to: resolvePosition(block, block.childNodes.length, block.textContent?.length ?? 0),
      }]
    }

    return {
      blockIndex,
      nodeId: block.dataset.layoutId ?? `block-${blockIndex + 1}`,
      tagName: block.tagName.toLowerCase(),
      lines,
      keepWithNext: /^H[1-6]$/.test(block.tagName),
      unsplittable: block.matches('table, hr') || Boolean(block.querySelector('table, img, hr')),
      candidateBreakLineIndex: null,
    }
  })
}
