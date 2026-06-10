import type { LucideIcon } from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type DashboardSummaryCardTone = "default" | "positive" | "negative" | "warning"

type DashboardSummaryCardProps = {
  title: string
  value: string
  description: string
  icon: LucideIcon
  tone?: DashboardSummaryCardTone
}

const toneClasses: Record<DashboardSummaryCardTone, string> = {
  default: "bg-muted text-muted-foreground",
  positive: "bg-emerald-100 text-emerald-700",
  negative: "bg-red-100 text-red-700",
  warning: "bg-amber-100 text-amber-700",
}

export function DashboardSummaryCard({
  title,
  value,
  description,
  icon: Icon,
  tone = "default",
}: DashboardSummaryCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>

        <div className={`rounded-full p-2 ${toneClasses[tone]}`}>
          <Icon className="size-4" />
        </div>
      </CardHeader>

      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}