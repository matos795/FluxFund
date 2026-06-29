const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024

export function validateOrganizationLogo(file: File): string | null {
  if (file.size > MAX_LOGO_SIZE_BYTES) {
    return "A logo deve ter no máximo 2 MB."
  }

  const extension = getFileExtension(file.name)

  if (!["png", "jpg", "jpeg"].includes(extension)) {
    return "Envie uma imagem PNG, JPG ou JPEG."
  }

  const allowedTypes = ["image/png", "image/jpeg"]

  if (file.type && !allowedTypes.includes(file.type.toLowerCase())) {
    return "O arquivo selecionado não é uma imagem PNG ou JPEG válida."
  }

  return null
}

function getFileExtension(filename: string) {
  const lastDotIndex = filename.lastIndexOf(".")

  if (lastDotIndex < 0 || lastDotIndex === filename.length - 1) {
    return ""
  }

  return filename.slice(lastDotIndex + 1).toLowerCase()
}