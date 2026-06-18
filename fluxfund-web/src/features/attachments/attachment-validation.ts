const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024

const ALLOWED_ATTACHMENT_EXTENSIONS = ["pdf", "png", "jpg", "jpeg"]

const ALLOWED_ATTACHMENT_CONTENT_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
]

export function validateAttachmentFile(file: File): string | null {
  if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
    return "O arquivo deve ter no máximo 10 MB."
  }

  const extension = getFileExtension(file.name)

  if (!extension) {
    return "O arquivo precisa ter uma extensão válida."
  }

  if (!ALLOWED_ATTACHMENT_EXTENSIONS.includes(extension)) {
    return "Envie apenas arquivos PDF, PNG, JPG ou JPEG."
  }

  if (
    file.type &&
    !ALLOWED_ATTACHMENT_CONTENT_TYPES.includes(file.type.toLowerCase())
  ) {
    return "O tipo do arquivo não é permitido."
  }

  return null
}

export function getAttachmentAcceptAttribute() {
  return ".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
}

export function getAttachmentRulesDescription() {
  return "Formatos permitidos: PDF, PNG, JPG ou JPEG, até 10 MB."
}

function getFileExtension(filename: string) {
  const lastDotIndex = filename.lastIndexOf(".")

  if (lastDotIndex < 0 || lastDotIndex === filename.length - 1) {
    return null
  }

  return filename.slice(lastDotIndex + 1).toLowerCase()
}