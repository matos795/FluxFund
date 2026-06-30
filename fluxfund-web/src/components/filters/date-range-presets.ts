export type DateRangePreset =
  | "current-month"
  | "previous-month"
  | "current-quarter"
  | "previous-quarter"
  | "current-year"
  | "previous-year"
  | "last-30-days"
  | "last-90-days"
  | "custom"

export type DateRangeValue = {
  preset: DateRangePreset
  startDate: string
  endDate: string
}

export const dateRangePresetLabels: Record<DateRangePreset, string> = {
  "current-month": "Mês atual",
  "previous-month": "Mês anterior",
  "current-quarter": "Trimestre atual",
  "previous-quarter": "Trimestre anterior",
  "current-year": "Ano atual",
  "previous-year": "Ano anterior",
  "last-30-days": "Últimos 30 dias",
  "last-90-days": "Últimos 90 dias",
  custom: "Personalizado",
}

function pad(value: number) {
  return String(value).padStart(2, "0")
}

function toDateInputValue(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}`
}

function getStartOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function getEndOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

function getStartOfQuarter(date: Date) {
  const quarterStartMonth = Math.floor(date.getMonth() / 3) * 3

  return new Date(date.getFullYear(), quarterStartMonth, 1)
}

function getDateDaysAgo(baseDate: Date, days: number) {
  return new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate() - days,
  )
}

export function resolveDateRangePreset(
  preset: Exclude<DateRangePreset, "custom">,
  baseDate = new Date(),
) {
  if (preset === "current-month") {
    return {
      startDate: toDateInputValue(getStartOfMonth(baseDate)),
      endDate: toDateInputValue(baseDate),
    }
  }

  if (preset === "previous-month") {
    const previousMonth = new Date(
      baseDate.getFullYear(),
      baseDate.getMonth() - 1,
      1,
    )

    return {
      startDate: toDateInputValue(getStartOfMonth(previousMonth)),
      endDate: toDateInputValue(getEndOfMonth(previousMonth)),
    }
  }

  if (preset === "current-quarter") {
    return {
      startDate: toDateInputValue(getStartOfQuarter(baseDate)),
      endDate: toDateInputValue(baseDate),
    }
  }

  if (preset === "previous-quarter") {
    const currentQuarterStart = getStartOfQuarter(baseDate)

    const previousQuarterStart = new Date(
      currentQuarterStart.getFullYear(),
      currentQuarterStart.getMonth() - 3,
      1,
    )

    const previousQuarterEnd = new Date(
      currentQuarterStart.getFullYear(),
      currentQuarterStart.getMonth(),
      0,
    )

    return {
      startDate: toDateInputValue(previousQuarterStart),
      endDate: toDateInputValue(previousQuarterEnd),
    }
  }

  if (preset === "current-year") {
    return {
      startDate: toDateInputValue(
        new Date(baseDate.getFullYear(), 0, 1),
      ),
      endDate: toDateInputValue(baseDate),
    }
  }

  if (preset === "previous-year") {
    const previousYear = baseDate.getFullYear() - 1

    return {
      startDate: toDateInputValue(new Date(previousYear, 0, 1)),
      endDate: toDateInputValue(new Date(previousYear, 11, 31)),
    }
  }

  if (preset === "last-30-days") {
    return {
      startDate: toDateInputValue(getDateDaysAgo(baseDate, 29)),
      endDate: toDateInputValue(baseDate),
    }
  }

  return {
    startDate: toDateInputValue(getDateDaysAgo(baseDate, 89)),
    endDate: toDateInputValue(baseDate),
  }
}

export function getDateRangeForPreset(
  preset: Exclude<DateRangePreset, "custom">,
): DateRangeValue {
  return {
    preset,
    ...resolveDateRangePreset(preset),
  }
}