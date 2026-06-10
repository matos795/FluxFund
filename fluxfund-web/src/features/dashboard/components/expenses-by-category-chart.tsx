import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatCurrency } from "@/utils/formatters"
import type { ExpenseByCategoryItem } from "../dashboard-types"
import { DashboardCardSkeleton } from "./dashboard-card-skeleton"

type ExpensesByCategoryChartProps = {
  data: ExpenseByCategoryItem[]
  isLoading?: boolean
}

type TooltipPayloadItem = {
  name?: string
  value?: number
  payload?: ExpenseByCategoryItem & {
    shortCategoryName: string
  }
  color?: string
}

type CustomTooltipProps = {
  active?: boolean
  payload?: TooltipPayloadItem[]
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  const item = payload[0]?.payload

  if (!item) {
    return null
  }

  return (
    <div className="rounded-xl border bg-background/95 p-3 shadow-lg backdrop-blur">
      <p className="text-sm font-semibold">{item.categoryName}</p>

      <div className="mt-3 space-y-2">
        <div className="flex min-w-52 items-center justify-between gap-5 text-xs">
          <span className="text-muted-foreground">Valor</span>
          <span className="font-semibold">
            {formatCurrency(item.amount)}
          </span>
        </div>

        <div className="flex min-w-52 items-center justify-between gap-5 text-xs">
          <span className="text-muted-foreground">Participação</span>
          <span className="font-semibold">
            {item.percentage.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  )
}

function shortenCategoryName(name: string) {
  if (name.length <= 24) {
    return name
  }

  return `${name.slice(0, 24)}...`
}

export function ExpensesByCategoryChart({
  data,
  isLoading = false,
}: ExpensesByCategoryChartProps) {
  const hasData = data.length > 0

  const chartData = data.map((item) => ({
    ...item,
    shortCategoryName: shortenCategoryName(item.categoryName),
  }))

  if (isLoading) {
    return <DashboardCardSkeleton />
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle>Despesas por categoria</CardTitle>
        <p className="text-sm text-muted-foreground">
          Principais categorias de despesa no período selecionado.
        </p>
      </CardHeader>

      <CardContent>
        {!hasData ? (
          <div className="flex h-[340px] items-center justify-center rounded-xl border border-dashed bg-muted/20">
            <div className="text-center">
              <p className="font-medium">Sem despesas no período</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Quando houver despesas classificadas, elas aparecerão aqui.
              </p>
            </div>
          </div>
        ) : (
          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{
                  top: 12,
                  right: 56,
                  left: 8,
                  bottom: 8,
                }}
                barCategoryGap="28%"
              >
                <CartesianGrid
                  horizontal={false}
                  strokeDasharray="4 4"
                  className="stroke-muted"
                />

                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  fontSize={12}
                  tickFormatter={(value) =>
                    Intl.NumberFormat("pt-BR", {
                      notation: "compact",
                      compactDisplay: "short",
                    }).format(Number(value))
                  }
                />

                <YAxis
                  type="category"
                  dataKey="shortCategoryName"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  fontSize={12}
                  width={130}
                />

                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{
                    fill: "hsl(var(--muted))",
                    opacity: 0.35,
                  }}
                />

                <Bar
                  dataKey="amount"
                  name="Valor"
                  fill="hsl(var(--chart-4))"
                  fillOpacity={0.88}
                  radius={[0, 8, 8, 0]}
                  maxBarSize={28}
                >
                  <LabelList
                    dataKey="amount"
                    position="right"
                    formatter={(value: number) =>
                      Intl.NumberFormat("pt-BR", {
                        notation: "compact",
                        compactDisplay: "short",
                      }).format(Number(value))
                    }
                    className="fill-muted-foreground"
                    fontSize={11}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}