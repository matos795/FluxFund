import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function FundsTableSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fundos cadastrados</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border">
          <div className="grid grid-cols-8 gap-4 border-b p-4">
            <Skeleton className="h-4" />
            <Skeleton className="h-4" />
            <Skeleton className="h-4" />
            <Skeleton className="h-4" />
            <Skeleton className="h-4" />
            <Skeleton className="h-4" />
          </div>

          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="grid grid-cols-8 gap-4 border-b p-4 last:border-b-0"
            >
              <Skeleton className="h-4" />
              <Skeleton className="h-4" />
              <Skeleton className="h-4" />
              <Skeleton className="h-4" />
              <Skeleton className="h-4" />
              <Skeleton className="h-4" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}