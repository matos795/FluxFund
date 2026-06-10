import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
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
import type { MonthlyCashFlowItem } from "../dashboard-types"
import { DashboardCardSkeleton } from "./dashboard-card-skeleton"

type MonthlyCashFlowChartProps = {
  data: MonthlyCashFlowItem[]
  isLoading?: boolean
}

type TooltipPayloadItem = {
  name?: string
  value?: number
  color?: string
}

type CustomTooltipProps = {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  return (
    <div className="rounded-xl border bg-background/95 p-3 shadow-lg backdrop-blur">
      <p className="mb-3 text-sm font-semibold">{label}</p>

      <div className="space-y-2">
        {payload.map((item) => (
          <div
            key={item.name}
            className="flex min-w-52 items-center justify-between gap-5 text-xs"
          >
            <div className="flex items-center gap-2">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-muted-foreground">{item.name}</span>
            </div>

            <span className="font-semibold">
              {formatCurrency(Number(item.value ?? 0))}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function MonthlyCashFlowChart({
  data,
  isLoading = false,
}: MonthlyCashFlowChartProps) {

  if (isLoading) {
  return <DashboardCardSkeleton />
}

  const hasData = data.some(
    (item) => item.income !== 0 || item.expense !== 0 || item.net !== 0,
  )

  return (
    <Card className="col-span-full overflow-hidden xl:col-span-2">
      <CardHeader className="pb-2">
        <CardTitle>Evolução mensal</CardTitle>
        <p className="text-sm text-muted-foreground">
          Receitas, despesas e resultado financeiro por mês.
        </p>
      </CardHeader>

      <CardContent>
        {!hasData ? (
          <div className="flex h-[340px] items-center justify-center rounded-xl border border-dashed bg-muted/20">
            <div className="text-center">
              <p className="font-medium">Sem movimentações no período</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Quando houver receitas ou despesas, o gráfico aparecerá aqui.
              </p>
            </div>
          </div>
        ) : (
          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={data}
                margin={{
                  top: 16,
                  right: 16,
                  left: 4,
                  bottom: 0,
                }}
                barGap={6}
                barCategoryGap="26%"
              >
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="4 4"
                  className="stroke-muted"
                />

                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={12}
                  fontSize={12}
                />

                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={12}
                  fontSize={12}
                  width={70}
                  tickFormatter={(value) =>
                    Intl.NumberFormat("pt-BR", {
                      notation: "compact",
                      compactDisplay: "short",
                    }).format(Number(value))
                  }
                />

                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{
                    fill: "hsl(var(--muted))",
                    opacity: 0.35,
                  }}
                />

                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{
                    fontSize: 12,
                    paddingBottom: 12,
                  }}
                />

                <Bar
                  dataKey="income"
                  name="Receitas"
                  fill="hsl(var(--chart-1))"
                  fillOpacity={0.85}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={34}
                />

                <Bar
                  dataKey="expense"
                  name="Despesas"
                  fill="hsl(var(--chart-2))"
                  fillOpacity={0.85}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={34}
                />

                <Line
                  type="monotone"
                  dataKey="net"
                  name="Resultado"
                  stroke="hsl(var(--chart-3))"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                    strokeWidth: 2,
                    fill: "hsl(var(--background))",
                    stroke: "hsl(var(--chart-3))",
                  }}
                  activeDot={{
                    r: 6,
                    strokeWidth: 2,
                    fill: "hsl(var(--chart-3))",
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}