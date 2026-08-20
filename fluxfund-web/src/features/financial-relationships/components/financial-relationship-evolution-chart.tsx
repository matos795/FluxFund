import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

import {
    formatCurrency,
} from "@/utils/formatters"

import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts"
import type { FinancialRelationshipMonth } from "../financial-relationship-report-types"

type FinancialRelationshipEvolutionChartProps = {
    months: FinancialRelationshipMonth[]
}

function formatMonthLabel(
    value: string,
) {
    const [year, month] =
        value
            .slice(0, 7)
            .split("-")
            .map(Number)

    const date =
        new Date(
            year,
            month - 1,
            1,
        )

    return new Intl.DateTimeFormat(
        "pt-BR",
        {
            month: "short",
            year: "2-digit",
        },
    ).format(date)
}

export function FinancialRelationshipEvolutionChart({
    months,
}: FinancialRelationshipEvolutionChartProps) {
    const chartData = months.map(
        (month) => ({
            ...month,
            label: formatMonthLabel(
                month.referenceMonth,
            ),
        }),
    )

    return (
        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle>
                    Evolução dos relacionamentos
                </CardTitle>

                <p className="text-sm text-muted-foreground">
                    Compare as entradas provenientes de contatos com as saídas destinadas a contatos ao longo do período.
                </p>
            </CardHeader>

            <CardContent>
                <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />

                            <XAxis dataKey="label" />

                            <YAxis
                                tickFormatter={(value) =>
                                    formatCurrency(value)
                                }
                            />

                            <Tooltip
                                formatter={(value: number) =>
                                    formatCurrency(value)
                                }
                            />

                            <Legend />

                            <Line
                                type="monotone"
                                dataKey="receivedFromPartiesAmount"
                                name="Recebido"
                                strokeWidth={2}
                                dot={false}
                            />

                            <Line
                                type="monotone"
                                dataKey="paidToPartiesAmount"
                                name="Pago"
                                strokeWidth={2}
                                dot={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}