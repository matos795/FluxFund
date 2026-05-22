import { ArrowLeft } from "lucide-react"
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
import { groupCategoryResultItems } from "@/features/reports/category-result-utils"
import { CategoryResultStatement } from "@/features/reports/components/category-result-statement"

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

    const incomeGroups = groupCategoryResultItems(
        report?.items.filter((item) => item.type === "INCOME") ?? [],
    )

    const expenseGroups = groupCategoryResultItems(
        report?.items.filter((item) => item.type === "EXPENSE") ?? [],
    )

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

            <div className="grid gap-6 xl:grid-cols-2">
                <CategoryResultStatement
                    title="Receitas"
                    total={report?.incomeTotal ?? 0}
                    groups={incomeGroups}
                />

                <CategoryResultStatement
                    title="Despesas"
                    total={report?.expenseTotal ?? 0}
                    groups={expenseGroups}
                />
            </div>
        </div>
    )
}