import mammoth from 'mammoth'
import { validateImportFile } from './importValidation'

export async function importDocx(file: File) {
  const arrayBuffer = await validateImportFile(file, 'docx')

  const result = await mammoth.convertToHtml(
    { arrayBuffer },
    {
      styleMap: [
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
        "p[style-name='Title'] => h1:fresh",
        "p[style-name='Subtitle'] => h2:fresh",
      ],
      convertImage: mammoth.images.imgElement(async (element) => {
        const buffer = await element.read('base64')
        const contentType = element.contentType || 'image/png'
        return { src: `data:${contentType};base64,${buffer}` }
      }),
    }
  )

  const warnings = result.messages
    .filter((m) => m.type === 'warning')
    .map((m) => m.message)

  return {
    html: result.value,
    warnings,
  }
}
