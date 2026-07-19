import { LINE_BREAK_RULES, type BlockLineMeasurement, type LineFragment } from './lineMeasurement.ts'
import type { CanonicalPageBreak } from './layoutContract.ts'

export interface PageFragment {
  nodeId: string
  blockIndex: number
  lineIndex: number
  from: number
  to: number
  text: string
  heightPx: number
}

export interface PageLayout {
  pageNumber: number
  usedHeightPx: number
  fragments: PageFragment[]
}

export interface PageBreakDecoration {
  pageNumber: number
  from: number
  heightPx: number
}

export interface PageBreakInput {
  pageNumber: number
  position: CanonicalPageBreak['position']
}

function createPage(pages: PageLayout[]): PageLayout {
  const page = { pageNumber: pages.length + 1, usedHeightPx: 0, fragments: [] }
  pages.push(page)
  return page
}

function lineCost(lines: LineFragment[], index: number, firstInRange: boolean): number {
  if (firstInRange) return lines[index].height
  const gap = Math.max(0, lines[index].top - lines[index - 1].bottom)
  return gap + lines[index].height
}

function countFittingLines(
  lines: LineFragment[],
  start: number,
  availableHeightPx: number,
  gapBeforePx: number,
): number {
  let used = gapBeforePx
  let count = 0
  for (let index = start; index < lines.length; index += 1) {
    const cost = lineCost(lines, index, index === start)
    if (used + cost > availableHeightPx + 0.5) break
    used += cost
    count += 1
  }
  return count
}

function appendLines(
  page: PageLayout,
  block: BlockLineMeasurement,
  start: number,
  count: number,
  gapBeforePx: number,
) {
  page.usedHeightPx += gapBeforePx
  for (let index = start; index < start + count; index += 1) {
    const line = block.lines[index]
    page.usedHeightPx += lineCost(block.lines, index, index === start)
    page.fragments.push({
      nodeId: block.nodeId,
      blockIndex: block.blockIndex,
      lineIndex: index,
      from: line.from ?? line.startOffset,
      to: line.to ?? line.endOffset,
      text: line.text,
      heightPx: line.height,
    })
  }
}

function blockHeight(block: BlockLineMeasurement): number {
  return block.lines.reduce(
    (height, _line, index) => height + lineCost(block.lines, index, index === 0),
    0,
  )
}

export function buildPageLayouts(
  blocks: BlockLineMeasurement[],
  usableHeightPx: number,
): PageLayout[] {
  const pages: PageLayout[] = []
  let page = createPage(pages)
  let previousNaturalBottom = 0

  for (const [blockIndex, block] of blocks.entries()) {
    if (!block.lines.length) continue
    const naturalGap = Math.max(0, block.lines[0].top - previousNaturalBottom)
    previousNaturalBottom = block.lines[block.lines.length - 1].bottom
    const totalHeight = blockHeight(block)
    const nextBlock = blocks[blockIndex + 1]
    const keepWithNextHeight = block.keepWithNext && nextBlock?.lines.length
      ? Math.max(0, nextBlock.lines[0].top - previousNaturalBottom) + nextBlock.lines[0].height
      : 0

    if (
      page.fragments.length
      && naturalGap + totalHeight + keepWithNextHeight > usableHeightPx - page.usedHeightPx
      && (block.unsplittable || block.keepWithNext)
    ) page = createPage(pages)

    if (block.unsplittable) {
      appendLines(page, block, 0, block.lines.length, page.fragments.length ? naturalGap : 0)
      continue
    }

    let start = 0
    let gapBefore = page.fragments.length ? naturalGap : 0
    while (start < block.lines.length) {
      const remainingLines = block.lines.length - start
      const availableHeight = usableHeightPx - page.usedHeightPx
      let fittingLines = countFittingLines(block.lines, start, availableHeight, gapBefore)

      if (fittingLines === remainingLines) {
        appendLines(page, block, start, fittingLines, gapBefore)
        break
      }

      if (
        page.fragments.length
        && (fittingLines < LINE_BREAK_RULES.minOrphanLines
          || remainingLines - fittingLines < LINE_BREAK_RULES.minWidowLines)
      ) {
        page = createPage(pages)
        gapBefore = 0
        continue
      }

      if (fittingLines === 0) fittingLines = 1
      if (remainingLines - fittingLines < LINE_BREAK_RULES.minWidowLines) {
        fittingLines = Math.max(1, remainingLines - LINE_BREAK_RULES.minWidowLines)
      }

      appendLines(page, block, start, fittingLines, gapBefore)
      start += fittingLines
      page = createPage(pages)
      gapBefore = 0
    }
  }

  return pages
}

export function pageLayoutSignature(pages: PageLayout[]): string {
  return JSON.stringify(pages)
}

export function buildPageBreakDecorations(
  pages: PageLayout[],
  usableHeightPx: number,
  marginTopPx: number,
  marginBottomPx: number,
  pageGapPx: number,
): PageBreakDecoration[] {
  return pages.slice(1).flatMap((page, index) => {
    const firstFragment = page.fragments[0]
    if (!firstFragment) return []
    const previousPage = pages[index]
    return [{
      pageNumber: page.pageNumber,
      from: firstFragment.from,
      heightPx: Math.max(0, usableHeightPx - previousPage.usedHeightPx)
        + marginBottomPx
        + pageGapPx
        + marginTopPx,
    }]
  })
}

export function buildPageBreakDecorationsFromPlan(
  pageBreaks: PageBreakInput[],
  pages: PageLayout[],
  usableHeightPx: number,
  marginTopPx: number,
  marginBottomPx: number,
  pageGapPx: number,
): PageBreakDecoration[] {
  const pageByNumber = new Map(pages.map((page) => [page.pageNumber, page]))
  return pageBreaks.flatMap((pageBreak) => {
    const page = pageByNumber.get(pageBreak.pageNumber)
    const previousPage = pageByNumber.get(pageBreak.pageNumber - 1)
    const firstFragment = page?.fragments[0]
    if (!page || !previousPage || !firstFragment) return []
    return [{
      pageNumber: pageBreak.pageNumber,
      from: firstFragment.from,
      heightPx: Math.max(0, usableHeightPx - previousPage.usedHeightPx)
        + marginBottomPx
        + pageGapPx
        + marginTopPx,
    }]
  })
}
