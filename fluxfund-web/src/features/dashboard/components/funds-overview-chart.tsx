import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    LabelList,
    ReferenceLine,
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
import type { FundOverviewItem } from "../dashboard-types"
import { DashboardCardSkeleton } from "./dashboard-card-skeleton"

type FundsOverviewChartProps = {
    data: FundOverviewItem[]
    isLoading?: boolean
}

type TooltipPayloadItem = {
    payload?: FundOverviewItem & {
        shortFundName: string
    }
}

type CustomTooltipProps = {
    active?: boolean
    payload?: TooltipPayloadItem[]
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
    if (!active || !payload || payload.length === 0) return null

    const item = payload[0]?.payload
    if (!item) return null

    return (
        <div className="rounded-xl border bg-background/95 p-3 shadow-lg backdrop-blur">
            <p className="text-sm font-semibold">{item.fundName}</p>

            <div className="mt-3 space-y-2 text-xs">
                <div className="flex min-w-56 justify-between gap-5">
                    <span className="text-muted-foreground">Saldo atual</span>
                    <span className="font-semibold">{formatCurrency(item.currentBalance)}</span>
                </div>

                <div className="flex min-w-56 justify-between gap-5">
                    <span className="text-muted-foreground">Entradas</span>
                    <span className="font-semibold">{formatCurrency(item.incomeAllocated)}</span>
                </div>

                <div className="flex min-w-56 justify-between gap-5">
                    <span className="text-muted-foreground">Saídas</span>
                    <span className="font-semibold">{formatCurrency(item.expenseAllocated)}</span>
                </div>

                <div className="flex min-w-56 justify-between gap-5 border-t pt-2">
                    <span className="text-muted-foreground">Resultado</span>
                    <span className="font-semibold">{formatCurrency(item.periodBalance)}</span>
                </div>
            </div>
        </div>
    )
}

function shortenFundName(name: string) {
    if (name.length <= 24) {
        return name
    }

    return `${name.slice(0, 24)}...`
}

export function FundsOverviewChart({ data, isLoading = false }: FundsOverviewChartProps) {

    if (isLoading) {
        return <DashboardCardSkeleton />
    }
    
    const hasData = data.length > 0

    const chartData = data.map((item) => ({
        ...item,
        shortFundName: shortenFundName(item.fundName),
    }))

    return (
        <Card className="overflow-hidden">
            <CardHeader className="pb-2">
                <CardTitle>Situação dos fundos</CardTitle>
                <p className="text-sm text-muted-foreground">
                    Saldos atuais dos principais fundos e projetos internos.
                </p>
            </CardHeader>

            <CardContent>
                {!hasData ? (
                    <div className="flex h-[340px] items-center justify-center rounded-xl border border-dashed bg-muted/20">
                        <div className="text-center">
                            <p className="font-medium">Nenhum fundo encontrado</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Cadastre fundos ou alocações para visualizar esta análise.
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
                                    right: 64,
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
                                    dataKey="shortFundName"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={10}
                                    fontSize={12}
                                    width={135}
                                />

                                <ReferenceLine
                                    x={0}
                                    stroke="hsl(var(--border))"
                                    strokeWidth={1.5}
                                />

                                <Tooltip
                                    content={<CustomTooltip />}
                                    cursor={{
                                        fill: "hsl(var(--muted))",
                                        opacity: 0.35,
                                    }}
                                />

                                <Bar
                                    dataKey="currentBalance"
                                    name="Saldo atual"
                                    radius={[0, 8, 8, 0]}
                                    maxBarSize={28}
                                    fillOpacity={0.88}
                                >
                                    {chartData.map((item) => (
                                        <Cell
                                            key={item.fundId}
                                            fill={
                                                item.currentBalance < 0
                                                    ? "hsl(var(--chart-5))"
                                                    : "hsl(var(--chart-4))"
                                            }
                                        />
                                    ))}

                                    <LabelList
                                        dataKey="currentBalance"
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