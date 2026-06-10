import { Card, CardContent, CardHeader } from "@/components/ui/card"

type DashboardCardSkeletonProps = {
  height?: string
}

export function DashboardCardSkeleton({
  height = "h-[320px]",
}: DashboardCardSkeletonProps) {
  return (
    <Card>
      <CardHeader>
        <div className="h-5 w-40 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-64 max-w-full animate-pulse rounded-md bg-muted" />
      </CardHeader>

      <CardContent>
        <div className={`${height} animate-pulse rounded-lg bg-muted`} />
      </CardContent>
    </Card>
  )
}