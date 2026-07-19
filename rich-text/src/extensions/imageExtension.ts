import { Image } from '@tiptap/extension-image'

export const ImageExtension = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      textAlign: {
        default: 'center',
        parseHTML: (element) => element.getAttribute('data-text-align') || 'center',
        renderHTML: (attributes) => ({ 'data-text-align': attributes.textAlign }),
      },
    }
  },
}).configure({
  inline: false,
  allowBase64: true,
  resize: {
    enabled: true,
    directions: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
    minWidth: 50,
    minHeight: 50,
    alwaysPreserveAspectRatio: true,
  },
})
