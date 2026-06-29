export function formatCnpj(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 14)

  const firstPart = digits.slice(0, 2)
  const secondPart = digits.slice(2, 5)
  const thirdPart = digits.slice(5, 8)
  const fourthPart = digits.slice(8, 12)
  const fifthPart = digits.slice(12, 14)

  let formatted = firstPart

  if (secondPart) {
    formatted += `.${secondPart}`
  }

  if (thirdPart) {
    formatted += `.${thirdPart}`
  }

  if (fourthPart) {
    formatted += `/${fourthPart}`
  }

  if (fifthPart) {
    formatted += `-${fifthPart}`
  }

  return formatted
}

export function formatZipCode(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8)

  if (digits.length <= 5) {
    return digits
  }

  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}