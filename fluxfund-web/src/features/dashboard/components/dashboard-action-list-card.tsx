import type { LucideIcon } from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type DashboardActionListCardProps<T> = {
  title: string
  description: string
  icon: LucideIcon
  items: T[]
  emptyMessage: string
  viewAllTo: string
  renderItem: (item: T) => React.ReactNode
  getItemKey: (item: T) => string
  compact?: boolean
}

export function DashboardActionListCard<T>({
  title,
  description,
  icon: Icon,
  items,
  emptyMessage,
  viewAllTo,
  renderItem,
  getItemKey,
  compact = false,
}: DashboardActionListCardProps<T>) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-3">
        <div className="min-w-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
              <Icon className="size-4" />
            </span>
            <span className="truncate">{title}</span>
          </CardTitle>

          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {description}
          </p>
        </div>

        <Button asChild variant="outline" size="sm" className="shrink-0">
          <Link to={viewAllTo}>Ver tudo</Link>
        </Button>
      </CardHeader>

      <CardContent className={compact ? "pt-0" : undefined}>
        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <div className="divide-y rounded-lg border">
            {items.map((item) => (
              <div key={getItemKey(item)}>{renderItem(item)}</div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}