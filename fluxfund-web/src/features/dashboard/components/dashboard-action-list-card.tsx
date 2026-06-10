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
}: DashboardActionListCardProps<T>) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Icon className="size-4" />
            {title}
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>

        <Button asChild variant="outline" size="sm">
          <Link to={viewAllTo}>Ver tudo</Link>
        </Button>
      </CardHeader>

      <CardContent>
        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={getItemKey(item)}>{renderItem(item)}</div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}