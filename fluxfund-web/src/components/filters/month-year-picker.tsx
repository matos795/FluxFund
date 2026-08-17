import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

import {
  useState,
} from "react"

import {
  Button,
} from "@/components/ui/button"

import {
  cn,
} from "@/lib/utils"

const MONTHS = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
]

type MonthYearPickerProps = {
  value: string
  onChange: (value: string) => void
}

export function MonthYearPicker({
  value,
  onChange,
}: MonthYearPickerProps) {
  const selected =
    parseMonthValue(value)

  const currentDate =
    new Date()

  const [
    displayedYear,
    setDisplayedYear,
  ] = useState(
    selected?.year ??
      currentDate.getFullYear(),
  )

  function handleMonthChange(
    monthIndex: number,
  ) {
    onChange(
      `${displayedYear}-${String(
        monthIndex + 1,
      ).padStart(2, "0")}`,
    )
  }

  return (
    <div className="rounded-xl border bg-background p-3">
      <div className="mb-3 flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label="Ano anterior"
          onClick={() =>
            setDisplayedYear(
              (current) =>
                current - 1,
            )
          }
        >
          <ChevronLeft className="size-4" />
        </Button>

        <p className="text-sm font-semibold">
          {displayedYear}
        </p>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label="Próximo ano"
          onClick={() =>
            setDisplayedYear(
              (current) =>
                current + 1,
            )
          }
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {MONTHS.map(
          (month, index) => {
            const isSelected =
              selected?.year ===
                displayedYear &&
              selected.month ===
                index + 1

            return (
              <Button
                key={month}
                type="button"
                variant={
                  isSelected
                    ? "default"
                    : "ghost"
                }
                size="sm"
                className={cn(
                  "h-9",
                  !isSelected &&
                    "border border-transparent hover:border-border",
                )}
                aria-pressed={
                  isSelected
                }
                onClick={() =>
                  handleMonthChange(
                    index,
                  )
                }
              >
                {month}
              </Button>
            )
          },
        )}
      </div>
    </div>
  )
}

function parseMonthValue(
  value: string,
) {
  const [year, month] =
    value
      .split("-")
      .map(Number)

  if (
    !year ||
    !month ||
    month < 1 ||
    month > 12
  ) {
    return null
  }

  return {
    year,
    month,
  }
}