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
import { formatCurrency, formatDate } from "@/utils/formatters"
import { useCategoryResultReport } from "@/features/reports/hooks/use-category-result-report"
import { filterCategoryResultGroups, groupCategoryResultItems } from "@/features/reports/category-result-utils"
import { CategoryResultStatement } from "@/features/reports/components/category-result-statement"
import { useState } from "react"
import { getFirstDayOfCurrentMonth, getTodayDate } from "@/utils/date-getters"

export function CategoryResultReportPage() {

    const TEMP_ORGANIZATION_ID = "7b9ed617-92be-456d-81d6-dcde5841e7a0"

    const [search, setSearch] = useState("")
    const [startDate, setStartDate] = useState(getFirstDayOfCurrentMonth)
    const [endDate, setEndDate] = useState(getTodayDate)

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

    const filteredIncomeGroups = filterCategoryResultGroups(incomeGroups, search)

    const filteredExpenseGroups = filterCategoryResultGroups(expenseGroups, search)

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

            <section className="rounded-xl border bg-card p-4">
                <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
                    <div className="space-y-2">
                        <label
                            htmlFor="startDate"
                            className="text-sm font-medium"
                        >
                            Data inicial
                        </label>

                        <input
                            id="startDate"
                            type="date"
                            value={startDate}
                            onChange={(event) => setStartDate(event.target.value)}
                            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                        />
                    </div>

                    <div className="space-y-2">
                        <label
                            htmlFor="endDate"
                            className="text-sm font-medium"
                        >
                            Data final
                        </label>

                        <input
                            id="endDate"
                            type="date"
                            value={endDate}
                            onChange={(event) => setEndDate(event.target.value)}
                            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                        />
                    </div>

                    <div className="text-sm text-muted-foreground">
                        Dados de {formatDate(report?.startDate)} até {formatDate(report?.endDate)}
                    </div>
                </div>
            </section>

            <section className="rounded-xl border bg-card p-4">
                <div className="space-y-2">
                    <label htmlFor="categorySearch" className="text-sm font-medium">
                        Buscar categoria
                    </label>

                    <div className="flex gap-2">
                        <input
                            id="categorySearch"
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Digite o nome da categoria ou grupo..."
                            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                        />
                    </div>

                    {search && (
                        <p className="text-xs text-muted-foreground">
                            Exibindo categorias que correspondem a “{search}”.
                        </p>
                    )}
                </div>
            </section>

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
                    groups={filteredIncomeGroups}
                />

                <CategoryResultStatement
                    title="Despesas"
                    total={report?.expenseTotal ?? 0}
                    groups={filteredExpenseGroups}
                />
            </div>
        </div>
    )
}