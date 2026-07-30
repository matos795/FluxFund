export type DateRangePreset =
  | "all"
  | "current-month"
  | "previous-month"
  | "current-quarter"
  | "previous-quarter"
  | "current-year"
  | "previous-year"
  | "last-30-days"
  | "last-90-days"
  | "last-12-months"
  | "specific-day"
  | "specific-month"
  | "custom"

export type DateRangeValue = {
  preset: DateRangePreset
  startDate: string
  endDate: string
}

export const dateRangePresetLabels: Record<DateRangePreset, string> = {
  all: "Todo o período",
  "current-month": "Mês atual",
  "previous-month": "Mês anterior",
  "current-quarter": "Trimestre atual",
  "previous-quarter": "Trimestre anterior",
  "current-year": "Ano atual",
  "previous-year": "Ano anterior",
  "last-30-days": "Últimos 30 dias",
  "last-90-days": "Últimos 90 dias",
  "last-12-months": "Últimos 12 meses",
  "specific-day": "Escolher dia",
  "specific-month": "Escolher mês",
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

export function getCurrentDateInputValue() {
  return toDateInputValue(new Date())
}

export function getDayRange(dayValue: string) {
  if (!dayValue) {
    return {
      startDate: "",
      endDate: "",
    }
  }

  return {
    startDate: dayValue,
    endDate: dayValue,
  }
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
  preset: Exclude<DateRangePreset, "custom" | "specific-day" | "specific-month" | "all">,
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

  if (preset === "last-12-months") {
    return {
      startDate: toDateInputValue(
        new Date(
          baseDate.getFullYear(),
          baseDate.getMonth() - 11,
          1,
        ),
      ),
      endDate: toDateInputValue(baseDate),
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
  preset: Exclude<DateRangePreset, "custom" | "specific-day" | "specific-month" | "all">,
): DateRangeValue {
  return {
    preset,
    ...resolveDateRangePreset(preset),
  }
}

function toMonthInputValue(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`
}

export function getMonthRange(monthValue: string) {
  if (!monthValue) {
    return {
      startDate: "",
      endDate: "",
    }
  }

  const [year, month] = monthValue.split("-").map(Number)

  if (!year || !month) {
    return {
      startDate: "",
      endDate: "",
    }
  }

  const monthDate = new Date(year, month - 1, 1)

  return {
    startDate: toDateInputValue(getStartOfMonth(monthDate)),
    endDate: toDateInputValue(getEndOfMonth(monthDate)),
  }
}

export function getCurrentMonthInputValue() {
  return toMonthInputValue(new Date())
}