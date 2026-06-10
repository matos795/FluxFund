import {
  dashboardPeriodLabels,
  type DashboardPeriodPreset,
} from "../dashboard-periods"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type DashboardPeriodFilterProps = {
  value: DashboardPeriodPreset
  onChange: (value: DashboardPeriodPreset) => void
}

const presets: DashboardPeriodPreset[] = [
  "current-month",
  "previous-month",
  "current-year",
  "last-12-months",
]

export function DashboardPeriodFilter({
  value,
  onChange,
}: DashboardPeriodFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Período</span>

      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>

        <SelectContent>
          {presets.map((preset) => (
            <SelectItem key={preset} value={preset}>
              {dashboardPeriodLabels[preset]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}