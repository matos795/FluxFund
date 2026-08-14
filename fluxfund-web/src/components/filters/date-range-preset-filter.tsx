import {
  CalendarDays,
  CalendarRange,
  ChevronDown,
  SlidersHorizontal,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { formatDate } from "@/utils/formatters"

import {
  dateRangePresetLabels,
  getCurrentDateInputValue,
  getCurrentMonthInputValue,
  getDayRange,
  getMonthRange,
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
  presetOptions?: Exclude<DateRangePreset, "all">[]
  includeAllPeriodOption?: boolean
  layout?: "full" | "compact"

  showSummary?: boolean
}

const DEFAULT_PRESET_OPTIONS: Exclude<DateRangePreset, "all">[] = [
  "current-month",
  "previous-month",
  "specific-day",
  "specific-month",
  "current-quarter",
  "previous-quarter",
  "current-year",
  "previous-year",
  "last-30-days",
  "last-90-days",
  "last-12-months",
  "custom",
]

const QUICK_PRESETS: DateRangePreset[] = [
  "current-month",
  "previous-month",
  "specific-day",
  "specific-month",
  "current-quarter",
  "current-year",
]

const QUICK_PRESET_LABELS: Partial<
  Record<DateRangePreset, string>
> = {
  "current-month": "Mês atual",
  "previous-month": "Mês anterior",
  "specific-day": "Escolher dia",
  "specific-month": "Escolher mês",
  "current-quarter": "Trimestre atual",
  "current-year": "Ano atual",
}

export function DateRangePresetFilter({
  value,
  onChange,
  idPrefix,
  label = "Período",
  className,
  presetOptions,
  includeAllPeriodOption = false,
  layout = "full",
  showSummary = true,
}: DateRangePresetFilterProps) {
  const isAllPeriod = value.preset === "all"
  const isSpecificMonth = value.preset === "specific-month"
  const isCustom = value.preset === "custom"

  const isSpecificDay = value.preset === "specific-day"

  const hasInvalidRange =
    Boolean(value.startDate) &&
    Boolean(value.endDate) &&
    value.startDate > value.endDate

  const availablePresetOptions =
    presetOptions ?? DEFAULT_PRESET_OPTIONS

  const selectablePresets: DateRangePreset[] =
    includeAllPeriodOption
      ? ["all", ...availablePresetOptions]
      : availablePresetOptions

  const quickPresets = QUICK_PRESETS.filter((preset) =>
    selectablePresets.includes(preset),
  )

  const morePresetOptions = selectablePresets.filter(
    (preset) => !quickPresets.includes(preset),
  )

  const isMoreOptionSelected = morePresetOptions.includes(
    value.preset,
  )

  function handlePresetChange(nextPreset: DateRangePreset) {
    if (nextPreset === "all") {
      onChange({
        preset: "all",
        startDate: "",
        endDate: "",
      })

      return
    }

    if (nextPreset === "specific-day") {
      const dayValue =
        value.startDate &&
          value.startDate === value.endDate
          ? value.startDate
          : getCurrentDateInputValue()

      onChange({
        preset: "specific-day",
        ...getDayRange(dayValue),
      })

      return
    }

    if (nextPreset === "specific-month") {
      const monthValue = value.startDate
        ? value.startDate.slice(0, 7)
        : getCurrentMonthInputValue()

      onChange({
        preset: "specific-month",
        ...getMonthRange(monthValue),
      })

      return
    }

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
    <div className={cn("space-y-3", className)}>
      <Label>{label}</Label>

      {layout === "compact" ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant={isAllPeriod ? "outline" : "secondary"}
              className="h-9 w-full justify-between px-3"
            >
              <span className="flex min-w-0 items-center gap-2">
                <CalendarRange className="size-4 shrink-0" />

                <span className="truncate">
                  {dateRangePresetLabels[value.preset]}
                </span>
              </span>

              <ChevronDown className="size-4 shrink-0" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            side="bottom"
            align="start"
            sideOffset={6}
            collisionPadding={12}
            className="w-60"
          >
            <DropdownMenuLabel>
              Selecionar período
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuRadioGroup
              value={value.preset}
              onValueChange={(nextValue) =>
                handlePresetChange(nextValue as DateRangePreset)
              }
            >
              {selectablePresets.map((preset) => (
                <DropdownMenuRadioItem
                  key={preset}
                  value={preset}
                >
                  {dateRangePresetLabels[preset]}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {quickPresets.map((preset) => {
            const isSelected = value.preset === preset
            const usesCalendarDayIcon =
              preset === "specific-day" ||
              preset === "specific-month"

            return (
              <Button
                key={preset}
                type="button"
                size="sm"
                variant={isSelected ? "default" : "outline"}
                className="h-9 rounded-full px-3"
                onClick={() => handlePresetChange(preset)}
              >
                {usesCalendarDayIcon ? (
                  <CalendarDays className="mr-1.5 size-4" />
                ) : (
                  <CalendarRange className="mr-1.5 size-4" />
                )}

                {QUICK_PRESET_LABELS[preset] ??
                  dateRangePresetLabels[preset]}
              </Button>
            )
          })}

          {morePresetOptions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  size="sm"
                  variant={
                    isMoreOptionSelected
                      ? "secondary"
                      : "outline"
                  }
                  className="h-9 rounded-full px-3"
                >
                  <SlidersHorizontal className="mr-1.5 size-4" />

                  {isMoreOptionSelected
                    ? dateRangePresetLabels[value.preset]
                    : "Mais períodos"}

                  <ChevronDown className="ml-1 size-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                side="bottom"
                align="start"
                sideOffset={6}
                collisionPadding={12}
                className="w-56"
              >
                <DropdownMenuLabel>
                  Outros períodos
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuRadioGroup
                  value={
                    isMoreOptionSelected
                      ? value.preset
                      : ""
                  }
                  onValueChange={(nextValue) =>
                    handlePresetChange(
                      nextValue as DateRangePreset,
                    )
                  }
                >
                  {morePresetOptions.map((preset) => (
                    <DropdownMenuRadioItem
                      key={preset}
                      value={preset}
                    >
                      {dateRangePresetLabels[preset]}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}

      {isAllPeriod ? (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
          <CalendarRange className="size-4 shrink-0" />
          Nenhuma restrição de data será aplicada.
        </div>
      ) : isSpecificDay ? (
        <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
          <Label htmlFor={`${idPrefix}-specific-day`}>
            Dia
          </Label>

          <Input
            id={`${idPrefix}-specific-day`}
            type="date"
            value={value.startDate}
            onChange={(event) => {
              onChange({
                preset: "specific-day",
                ...getDayRange(event.target.value),
              })
            }}
          />

          <p className="text-xs text-muted-foreground">
            O período considerará somente o dia selecionado.
          </p>
        </div>
      ) : isSpecificMonth ? (
        <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
          <Label htmlFor={`${idPrefix}-month`}>
            Mês e ano
          </Label>

          <Input
            id={`${idPrefix}-month`}
            type="month"
            value={value.startDate.slice(0, 7)}
            onChange={(event) => {
              onChange({
                preset: "specific-month",
                ...getMonthRange(event.target.value),
              })
            }}
          />

          <p className="text-xs text-muted-foreground">
            O período considerará todo o mês selecionado.
          </p>
        </div>
      ) : isCustom ? (
        <div className="rounded-lg border bg-muted/20 p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}-start-date`}>
                Data inicial
              </Label>

              <Input
                id={`${idPrefix}-start-date`}
                type="date"
                value={value.startDate}
                onChange={(event) =>
                  handleDateChange(
                    "startDate",
                    event.target.value,
                  )
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
                  handleDateChange(
                    "endDate",
                    event.target.value,
                  )
                }
              />
            </div>
          </div>

          {hasInvalidRange && (
            <p className="mt-3 text-sm text-destructive">
              A data final não pode ser anterior à data inicial.
            </p>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
          <CalendarRange className="size-4 shrink-0" />

          <span>
            De {formatDate(value.startDate)} até{" "}
            {formatDate(value.endDate)}
          </span>
        </div>
      )}
    </div>
  )
}