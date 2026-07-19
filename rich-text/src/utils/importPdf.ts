import * as pdfjsLib from 'pdfjs-dist'
import { APP_CONFIG } from '../config'
import { ImportValidationError, validateImportFile } from './importValidation'

pdfjsLib.GlobalWorkerOptions.workerSrc = APP_CONFIG.pdfWorkerUrl

const MAX_PAGE_PIXELS = 20_000_000
const MAX_TOTAL_PIXELS = 200_000_000

export interface PdfPageData {
  pageNumber: number
  width: number
  height: number
  canvas: HTMLCanvasElement
}

export async function importPdf(file: File): Promise<{
  pdfData: ArrayBuffer
  totalPages: number
  pages: PdfPageData[]
}> {
  const arrayBuffer = await validateImportFile(file, 'pdf')
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise
  const totalPages = pdf.numPages
  if (totalPages > APP_CONFIG.maxPdfPages) {
    await pdf.destroy()
    throw new ImportValidationError('PAYLOAD_TOO_LARGE', 'PDF has too many pages.')
  }
  const pages: PdfPageData[] = []
  let totalPixels = 0

  const SCALE = 1.5

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale: SCALE })
    const pagePixels = viewport.width * viewport.height
    totalPixels += pagePixels
    if (pagePixels > MAX_PAGE_PIXELS || totalPixels > MAX_TOTAL_PIXELS) {
      await pdf.destroy()
      throw new ImportValidationError('PAYLOAD_TOO_LARGE', 'PDF pages exceed the render limit.')
    }

    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      await pdf.destroy()
      throw new ImportValidationError('INVALID_DOCUMENT', 'Unable to create a PDF render surface.')
    }

    await page.render({ canvasContext: ctx, viewport }).promise

    pages.push({
      pageNumber: i,
      width: viewport.width,
      height: viewport.height,
      canvas,
    })
  }

  await pdf.destroy()

  return {
    pdfData: arrayBuffer,
    totalPages,
    pages,
  }
}
