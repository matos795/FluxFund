export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

export function formatCents(
  value: number | string | null | undefined,
): number {
  const numericValue = Number(value ?? 0)

  if (!Number.isFinite(numericValue)) {
    return 0
  }

  return Math.round((numericValue + Number.EPSILON) * 100)
}

export function fromCents(cents: number): number {
  return cents / 100
}

export function normalizeMoney(
  value: number | string | null | undefined,
): number {
  return fromCents(formatCents(value))
}

export function formatDate(value: string | null | undefined) {
  if (!value) {
    return "-"
  }

  const [year, month, day] = value.split("-")

  if (!year || !month || !day) {
    return value
  }

  return `${day}/${month}/${year}`
}

export function toReferenceMonthDate(value?: string | null) {
  return value ? `${value}-01` : null
}

export function formatReferenceMonth(value: string | null | undefined) {
  if (!value) {
    return "-"
  }

  const [year, month] = value.split("-")

  if (!year || !month) {
    return value
  }

  return `${month}/${year}`
}