const MONTH_LABELS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
]

function pad2(value: number) {
  return String(value).padStart(2, "0")
}

function parseReferenceMonth(referenceMonth: string) {
  const [yearText, monthText] = referenceMonth.split("-")

  const year = Number(yearText)
  const month = Number(monthText)

  if (!year || !month || month < 1 || month > 12) {
    return null
  }

  return { year, month }
}

function addMonths(year: number, month: number, monthsToAdd: number) {
  const date = new Date(year, month - 1 + monthsToAdd, 1)

  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
  }
}

export function getReferenceMonthLabel(referenceMonth: string) {
  const parsed = parseReferenceMonth(referenceMonth)

  if (!parsed) {
    return ""
  }

  return `${MONTH_LABELS[parsed.month - 1]}/${parsed.year}`
}

export function getDefaultClosingDate(referenceMonth: string) {
  const parsed = parseReferenceMonth(referenceMonth)

  if (!parsed) {
    return ""
  }

  const lastDay = new Date(parsed.year, parsed.month, 0).getDate()

  return `${parsed.year}-${pad2(parsed.month)}-${pad2(lastDay)}`
}

export function getDefaultDueDate(referenceMonth: string, dueDay = 10) {
  const parsed = parseReferenceMonth(referenceMonth)

  if (!parsed) {
    return ""
  }

  const nextMonth = addMonths(parsed.year, parsed.month, 1)

  return `${nextMonth.year}-${pad2(nextMonth.month)}-${pad2(dueDay)}`
}

export function buildCreditCardStatementName({
  accountName,
  referenceMonth,
}: {
  accountName?: string
  referenceMonth: string
}) {
  const monthLabel = getReferenceMonthLabel(referenceMonth)

  if (!monthLabel) {
    return ""
  }

  if (!accountName) {
    return `Fatura ${monthLabel}`
  }

  return `Fatura ${accountName} - ${monthLabel}`
}