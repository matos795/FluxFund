import { ArrowLeft, BarChart3 } from "lucide-react"
import { Link } from "react-router-dom"

import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { formatCurrency } from "@/utils/formatters"
import { useCategoryResultReport } from "@/features/reports/hooks/use-category-result-report"

function getTransactionTypeLabel(type: string) {
    if (type === "INCOME") return "Receita"
    if (type === "EXPENSE") return "Despesa"
    if (type === "TRANSFER") return "Transferência"

    return type
}

export function CategoryResultReportPage() {

    const TEMP_ORGANIZATION_ID = "7b9ed617-92be-456d-81d6-dcde5841e7a0"

    const today = new Date()

    const startDate = new Date(today.getFullYear(), today.getMonth(), 1)
        .toISOString()
        .slice(0, 10)

    const endDate = today.toISOString().slice(0, 10)

    const {
        data: report,
        isLoading,
        isError,
    } = useCategoryResultReport({
        organizationId: TEMP_ORGANIZATION_ID,
        startDate,
        endDate,
    })

    if (isLoading) {
        return <p>Carregando relatório...</p>
    }

    if (isError) {
        return <p>Não foi possível carregar o relatório.</p>
    }

    return (
        <div className="space-y-6">
            <Button asChild variant="ghost" className="px-0">
                <Link to="/reports">
                    <ArrowLeft className="mr-2 size-4" />
                    Voltar para relatórios
                </Link>
            </Button>

            <PageHeader
                title="Resultado por Categoria"
                description={`Analise receitas, despesas e resultado de ${report?.startDate} até ${report?.endDate}.`}
            />

            <section className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">
                            Receitas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(report?.incomeTotal ?? 0)}</div>
                        <p className="text-xs text-muted-foreground">
                            Total de entradas no período.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">
                            Despesas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(report?.expenseTotal ?? 0)}</div>
                        <p className="text-xs text-muted-foreground">
                            Total de saídas no período.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">
                            Resultado
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(report?.netTotal ?? 0)}</div>
                        <p className="text-xs text-muted-foreground">
                            Receitas menos despesas.
                        </p>
                    </CardContent>
                </Card>
            </section>

            <Card>
                <CardHeader className="flex flex-row items-center gap-3">
                    <div className="rounded-xl bg-muted p-2">
                        <BarChart3 className="size-5 text-muted-foreground" />
                    </div>

                    <div>
                        <CardTitle>Resumo por categoria</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Totais agrupados por categoria no período selecionado.
                        </p>
                    </div>
                </CardHeader>

                <CardContent>
                    {report?.items.length === 0 ? (
                        <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
                            Nenhum dado encontrado para o período.
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-lg border">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium">Categoria</th>
                                        <th className="px-4 py-3 text-left font-medium">Tipo</th>
                                        <th className="px-4 py-3 text-right font-medium">Total</th>
                                        <th className="px-4 py-3 text-right font-medium">
                                            Transações
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {report?.items.map((item) => (
                                        <tr key={item.categoryId} className="border-t">
                                            <td className="px-4 py-3">{item.categoryName}</td>
                                            <td className="px-4 py-3">
                                                {getTransactionTypeLabel(item.type)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium">
                                                {formatCurrency(item.total)}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {item.transactionCount}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}