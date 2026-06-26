const MAX_BANK_STATEMENT_SIZE_BYTES = 10 * 1024 * 1024

export function validateBankStatementPdf(file: File): string | null {
  if (file.size > MAX_BANK_STATEMENT_SIZE_BYTES) {
    return "O extrato deve ter no máximo 10 MB."
  }

  const extension = getFileExtension(file.name)

  if (extension !== "pdf") {
    return "Envie apenas extratos em PDF."
  }

  if (file.type && file.type.toLowerCase() !== "application/pdf") {
    return "O arquivo selecionado não é um PDF válido."
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