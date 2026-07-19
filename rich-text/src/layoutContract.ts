import type { JSONContent } from '@tiptap/core'
import { DOCUMENT_PAGE_SPEC, type DocumentMargins } from './pageSpec.ts'
import type { PageLayout } from './paginationModel.ts'

export const CANONICAL_PAGE_PLAN_VERSION = 1
export const LAYOUT_ALGORITHM_VERSION = 1

export type LogicalPosition =
  | { kind: 'before-block'; nodeId: string }
  | { kind: 'text-offset'; nodeId: string; offset: number }

export interface CanonicalPageBreak {
  pageNumber: number
  source: 'manual' | 'automatic'
  position: LogicalPosition
}

export interface CanonicalPagePlan {
  version: number
  documentRevision: string
  layoutFingerprint: string
  pageCount: number
  breaks: CanonicalPageBreak[]
}

interface BuildCanonicalPagePlanOptions {
  document: JSONContent
  margins: DocumentMargins
  pages: PageLayout[]
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

export function stableHash(value: unknown): string {
  const input = stableStringify(value)
  let hash = 0x811c9dc5
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

export function createDocumentRevision(document: JSONContent): string {
  return `doc-${stableHash(document)}`
}

export function createLayoutFingerprint(
  documentRevision: string,
  margins: DocumentMargins,
): string {
  return `layout-${stableHash({
    documentRevision,
    pageSpec: DOCUMENT_PAGE_SPEC,
    margins,
    algorithmVersion: LAYOUT_ALGORITHM_VERSION,
  })}`
}

function pageBreakKey(pageBreak: CanonicalPageBreak): string {
  const position = pageBreak.position
  return position.kind === 'before-block'
    ? `${pageBreak.pageNumber}:before:${position.nodeId}`
    : `${pageBreak.pageNumber}:text:${position.nodeId}:${position.offset}`
}

export function buildCanonicalPagePlan({
  document,
  margins,
  pages,
}: BuildCanonicalPagePlanOptions): CanonicalPagePlan {
  const documentRevision = createDocumentRevision(document)
  const seen = new Set<string>()
  const breaks: CanonicalPageBreak[] = []

  for (const page of pages.slice(1)) {
    const firstFragment = page.fragments[0]
    if (!firstFragment) continue
    const pageBreak: CanonicalPageBreak = {
      pageNumber: page.pageNumber,
      source: 'automatic',
      position: firstFragment.lineIndex === 0
        ? { kind: 'before-block', nodeId: firstFragment.nodeId }
        : {
            kind: 'text-offset',
            nodeId: firstFragment.nodeId,
            offset: firstFragment.from,
          },
    }
    const key = pageBreakKey(pageBreak)
    if (seen.has(key)) continue
    seen.add(key)
    breaks.push(pageBreak)
  }

  return {
    version: CANONICAL_PAGE_PLAN_VERSION,
    documentRevision,
    layoutFingerprint: createLayoutFingerprint(documentRevision, margins),
    pageCount: Math.max(1, pages.length),
    breaks,
  }
}

export function isCanonicalPagePlan(value: unknown): value is CanonicalPagePlan {
  if (!value || typeof value !== 'object') return false
  const plan = value as CanonicalPagePlan
  return plan.version === CANONICAL_PAGE_PLAN_VERSION
    && typeof plan.documentRevision === 'string'
    && typeof plan.layoutFingerprint === 'string'
    && Number.isInteger(plan.pageCount)
    && plan.pageCount >= 1
    && Array.isArray(plan.breaks)
    && plan.breaks.every((pageBreak) =>
      Number.isInteger(pageBreak.pageNumber)
      && pageBreak.pageNumber >= 2
      && (pageBreak.source === 'manual' || pageBreak.source === 'automatic')
      && typeof pageBreak.position === 'object'
      && pageBreak.position !== null
      && typeof pageBreak.position.nodeId === 'string'
      && (
        pageBreak.position.kind === 'before-block'
        || (
          pageBreak.position.kind === 'text-offset'
          && Number.isInteger(pageBreak.position.offset)
          && pageBreak.position.offset >= 0
        )
      ),
    )
}
