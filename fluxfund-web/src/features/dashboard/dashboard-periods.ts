export type DashboardPeriodPreset =
  | "current-month"
  | "previous-month"
  | "current-year"
  | "last-12-months"

export type DashboardPeriod = {
  preset: DashboardPeriodPreset
  startDate: string
  endDate: string
}

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10)
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

function startOfYear(date: Date) {
  return new Date(date.getFullYear(), 0, 1)
}

export function getDashboardPeriod(
  preset: DashboardPeriodPreset,
  baseDate = new Date(),
): DashboardPeriod {
  if (preset === "current-month") {
    return {
      preset,
      startDate: toDateInputValue(startOfMonth(baseDate)),
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
      preset,
      startDate: toDateInputValue(startOfMonth(previousMonth)),
      endDate: toDateInputValue(endOfMonth(previousMonth)),
    }
  }

  if (preset === "last-12-months") {
    const startDate = new Date(
      baseDate.getFullYear(),
      baseDate.getMonth() - 11,
      1,
    )

    return {
      preset,
      startDate: toDateInputValue(startDate),
      endDate: toDateInputValue(baseDate),
    }
  }

  return {
    preset: "current-year",
    startDate: toDateInputValue(startOfYear(baseDate)),
    endDate: toDateInputValue(baseDate),
  }
}

export const dashboardPeriodLabels: Record<DashboardPeriodPreset, string> = {
  "current-month": "Mês atual",
  "previous-month": "Mês anterior",
  "current-year": "Ano atual",
  "last-12-months": "Últimos 12 meses",
}