import { CalendarRange } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { formatDate } from "@/utils/formatters"

import {
  dateRangePresetLabels,
  resolveDateRangePreset,
  type DateRangePreset,
  type DateRangeValue,
} from "./date-range-presets"

type DateRangePresetFilterProps = {
  value: DateRangeValue
  onChange: (value: DateRangeValue) => void
  idPrefix: string
  label?: string
  className?: string
}

const presets: DateRangePreset[] = [
  "current-month",
  "previous-month",
  "current-quarter",
  "previous-quarter",
  "current-year",
  "previous-year",
  "last-30-days",
  "last-90-days",
  "custom",
]

export function DateRangePresetFilter({
  value,
  onChange,
  idPrefix,
  label = "Período",
  className,
}: DateRangePresetFilterProps) {
  const isCustom = value.preset === "custom"

  const hasInvalidRange =
    Boolean(value.startDate) &&
    Boolean(value.endDate) &&
    value.startDate > value.endDate

  function handlePresetChange(nextPreset: DateRangePreset) {
    if (nextPreset === "custom") {
      onChange({
        ...value,
        preset: "custom",
      })

      return
    }

    onChange({
      preset: nextPreset,
      ...resolveDateRangePreset(nextPreset),
    })
  }

  function handleDateChange(
    field: "startDate" | "endDate",
    nextValue: string,
  ) {
    onChange({
      ...value,
      preset: "custom",
      [field]: nextValue,
    })
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={`${idPrefix}-preset`}>{label}</Label>

      <Select
        value={value.preset}
        onValueChange={(nextValue) =>
          handlePresetChange(nextValue as DateRangePreset)
        }
      >
        <SelectTrigger id={`${idPrefix}-preset`}>
          <CalendarRange className="mr-2 size-4 text-muted-foreground" />
          <SelectValue />
        </SelectTrigger>

        <SelectContent>
          {presets.map((preset) => (
            <SelectItem key={preset} value={preset}>
              {dateRangePresetLabels[preset]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isCustom ? (
        <div className="grid gap-3 pt-1 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-start-date`}>
              Data inicial
            </Label>

            <Input
              id={`${idPrefix}-start-date`}
              type="date"
              value={value.startDate}
              onChange={(event) =>
                handleDateChange("startDate", event.target.value)
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-end-date`}>
              Data final
            </Label>

            <Input
              id={`${idPrefix}-end-date`}
              type="date"
              value={value.endDate}
              onChange={(event) =>
                handleDateChange("endDate", event.target.value)
              }
            />
          </div>

          {hasInvalidRange && (
            <p className="sm:col-span-2 text-sm text-destructive">
              A data final não pode ser anterior à data inicial.
            </p>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          De {formatDate(value.startDate)} até {formatDate(value.endDate)}
        </p>
      )}
    </div>
  )
}