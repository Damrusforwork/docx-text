export const MAX_LAYOUT_MANIFEST_BYTES = 250_000
export const MAX_LAYOUT_BREAKS = 1_000

export class LayoutPlanValidationError extends Error {
  readonly code: 'LAYOUT_PLAN_INVALID' | 'LAYOUT_STALE'
  readonly status: number

  constructor(
    code: 'LAYOUT_PLAN_INVALID' | 'LAYOUT_STALE',
    message: string,
    status: number,
  ) {
    super(message)
    this.name = 'LayoutPlanValidationError'
    this.code = code
    this.status = status
  }
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

export function createDocumentRevision(documentContent: unknown): string {
  return `doc-${stableHash(documentContent)}`
}

function invalid(message: string): never {
  throw new LayoutPlanValidationError('LAYOUT_PLAN_INVALID', message, 400)
}

function stale(message: string): never {
  throw new LayoutPlanValidationError('LAYOUT_STALE', message, 409)
}

function collectLayoutIds(value: unknown, ids = new Set<string>()) {
  if (!value || typeof value !== 'object') return ids
  const node = value as { attrs?: { layoutId?: unknown }; content?: unknown }
  if (typeof node.attrs?.layoutId === 'string') ids.add(node.attrs.layoutId)
  if (Array.isArray(node.content)) {
    for (const child of node.content) collectLayoutIds(child, ids)
  }
  return ids
}

export function validateLayoutManifest(body: {
  document?: unknown
  legacyLayout?: boolean
  renderManifest?: unknown
}) {
  if (body.legacyLayout) return
  if (body.renderManifest === undefined) return
  if (!body.renderManifest || typeof body.renderManifest !== 'object') {
    invalid('renderManifest must be an object.')
  }
  if (Buffer.byteLength(JSON.stringify(body.renderManifest), 'utf8') > MAX_LAYOUT_MANIFEST_BYTES) {
    invalid('renderManifest exceeds the allowed size.')
  }

  const manifest = body.renderManifest as {
    pageCount?: unknown
    pagePlan?: {
      version?: unknown
      documentRevision?: unknown
      layoutFingerprint?: unknown
      pageCount?: unknown
      breaks?: unknown
    }
  }
  const plan = manifest.pagePlan
  if (plan === undefined) return
  if (!plan || typeof plan !== 'object' || plan.version !== 1) {
    invalid('Unsupported layout plan.')
  }
  if (!body.document || typeof body.document !== 'object' || !('content' in body.document)) {
    invalid('document is required with pagePlan.')
  }

  const documentContent = (body.document as { content: unknown }).content
  if (plan.documentRevision !== createDocumentRevision(documentContent)) {
    stale('Layout plan does not match the document.')
  }
  if (typeof plan.layoutFingerprint !== 'string' || !Number.isInteger(plan.pageCount)) {
    invalid('Invalid layout plan metadata.')
  }
  const pageCount = plan.pageCount as number
  if (
    pageCount < 1
    || (manifest.pageCount !== undefined && manifest.pageCount !== pageCount)
    || !Array.isArray(plan.breaks)
    || plan.breaks.length > Math.min(MAX_LAYOUT_BREAKS, pageCount - 1)
  ) {
    invalid('Invalid layout plan metadata.')
  }

  const layoutIds = collectLayoutIds(documentContent)
  const seen = new Set<string>()
  let lastPage = 1
  for (const pageBreak of plan.breaks as Array<{
    pageNumber?: unknown
    source?: unknown
    position?: { kind?: unknown; nodeId?: unknown; offset?: unknown }
  }>) {
    const position = pageBreak.position
    if (
      !Number.isInteger(pageBreak.pageNumber)
      || (pageBreak.source !== 'manual' && pageBreak.source !== 'automatic')
      || !position
      || typeof position.nodeId !== 'string'
      || !layoutIds.has(position.nodeId)
      || (
        position.kind !== 'before-block'
        && !(position.kind === 'text-offset' && Number.isInteger(position.offset))
      )
    ) {
      invalid('Invalid layout plan break.')
    }

    const pageNumber = pageBreak.pageNumber as number
    const offset = position.offset as number | undefined
    if (
      pageNumber < 2
      || pageNumber <= lastPage
      || (position.kind === 'text-offset' && (offset === undefined || offset < 0))
    ) {
      invalid('Invalid layout plan break.')
    }

    const key = position.kind === 'before-block'
      ? `before:${position.nodeId}`
      : `text:${position.nodeId}:${offset}`
    if (seen.has(key)) invalid('Duplicate layout plan break.')
    seen.add(key)
    lastPage = pageNumber
  }
}
