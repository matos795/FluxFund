import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { Skeleton } from "@/components/ui/skeleton"

export function FinancialPartiesTableSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Contatos cadastrados
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border">
          <div className="grid grid-cols-8 gap-4 border-b p-4">
            {Array.from({
              length: 8,
            }).map((_, index) => (
              <Skeleton
                key={index}
                className="h-4"
              />
            ))}
          </div>

          {Array.from({
            length: 6,
          }).map((_, rowIndex) => (
            <div
              key={rowIndex}
              className="grid grid-cols-7 gap-4 border-b p-4 last:border-b-0"
            >
              {Array.from({
                length: 8,
              }).map((_, columnIndex) => (
                <Skeleton
                  key={columnIndex}
                  className="h-4"
                />
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}