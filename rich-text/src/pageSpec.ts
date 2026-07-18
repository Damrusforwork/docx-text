export interface DocumentMargins {
  top: number
  bottom: number
  left: number
  right: number
}

export interface PageSpec {
  name: string
  widthCm: number
  heightCm: number
  gapPx: number
  defaultMargins: DocumentMargins
  typography: {
    fontFamily: string
    fontSizePt: number
    lineHeightPt: number
  }
}

export const DOCUMENT_PAGE_SPEC = {
  name: 'A4',
  widthCm: 21,
  heightCm: 29.7,
  gapPx: 20,
  defaultMargins: {
    top: 1,
    bottom: 2.5,
    left: 3,
    right: 1.5,
  },
  typography: {
    fontFamily: "'TH Sarabun New', sans-serif",
    fontSizePt: 16,
    lineHeightPt: 24,
  },
} satisfies PageSpec
