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

import type {
  FinancialForecastMonth,
} from "../reports-types"

import {
  formatCurrency,
  formatReferenceMonth,
} from "@/utils/formatters"

type Props = {
  data:
    FinancialForecastMonth[]
}

type TooltipItem = {
  name?: string
  value?: number
  color?: string
}

type CustomTooltipProps = {
  active?: boolean
  label?: string
  payload?: TooltipItem[]
}

function CustomTooltip({
  active,
  label,
  payload,
}: CustomTooltipProps) {
  if (
    !active ||
    !payload ||
    payload.length === 0
  ) {
    return null
  }

  return (
    <div className="rounded-xl border bg-background/95 p-3 shadow-lg backdrop-blur">
      <p className="mb-3 text-sm font-semibold">
        {label}
      </p>

      <div className="space-y-2">
        {payload.map(
          (item) => (
            <div
              key={
                item.name
              }
              className="flex min-w-52 items-center justify-between gap-5 text-xs"
            >
              <div className="flex items-center gap-2">
                <span
                  className="size-2 rounded-full"
                  style={{
                    backgroundColor:
                      item.color,
                  }}
                />

                <span className="text-muted-foreground">
                  {item.name}
                </span>
              </div>

              <strong>
                {formatCurrency(
                  Number(
                    item.value ??
                      0,
                  ),
                )}
              </strong>
            </div>
          ),
        )}
      </div>
    </div>
  )
}

export function FinancialForecastChart({
  data,
}: Props) {
  const chartData =
    data.map(
      (item) => ({
        label:
          formatReferenceMonth(
            item.referenceMonth,
          ),

        receivable:
          item.receivableAmount,

        payable:
          item.payableAmount,

        cumulative:
          item.cumulativeNetAmount,
      }),
    )

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>
          Evolução da previsão
        </CardTitle>

        <p className="text-sm text-muted-foreground">
          Entradas e saídas planejadas, com a variação acumulada dos compromissos.
        </p>
      </CardHeader>

      <CardContent>
        <div className="h-[360px]">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <ComposedChart
              data={
                chartData
              }
              margin={{
                top: 16,
                right: 20,
                left: 8,
                bottom: 0,
              }}
              barGap={6}
              barCategoryGap="28%"
            >
              <CartesianGrid
                vertical={
                  false
                }
                strokeDasharray="4 4"
                className="stroke-muted"
              />

              <XAxis
                dataKey="label"
                tickLine={
                  false
                }
                axisLine={
                  false
                }
                tickMargin={
                  12
                }
                fontSize={
                  12
                }
              />

              <YAxis
                tickLine={
                  false
                }
                axisLine={
                  false
                }
                width={
                  72
                }
                fontSize={
                  12
                }
                tickFormatter={(
                  value,
                ) =>
                  Intl.NumberFormat(
                    "pt-BR",
                    {
                      notation:
                        "compact",
                    },
                  ).format(
                    Number(
                      value,
                    ),
                  )
                }
              />

              <Tooltip
                content={
                  <CustomTooltip />
                }
              />

              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{
                  fontSize:
                    12,
                  paddingBottom:
                    12,
                }}
              />

              <Bar
                dataKey="receivable"
                name="Entradas previstas"
                fill="hsl(var(--chart-1))"
                radius={[
                  6,
                  6,
                  0,
                  0,
                ]}
                maxBarSize={
                  36
                }
              />

              <Bar
                dataKey="payable"
                name="Saídas previstas"
                fill="hsl(var(--chart-2))"
                radius={[
                  6,
                  6,
                  0,
                  0,
                ]}
                maxBarSize={
                  36
                }
              />

              <Line
                type="monotone"
                dataKey="cumulative"
                name="Variação acumulada"
                stroke="hsl(var(--chart-3))"
                strokeWidth={
                  3
                }
                dot={{
                  r: 4,
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}