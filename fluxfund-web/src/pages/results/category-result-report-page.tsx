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
import { getDateRangeForPreset, type DateRangeValue } from "@/components/filters/date-range-presets"
import { DateRangePresetFilter } from "@/components/filters/date-range-preset-filter"

export function CategoryResultReportPage() {

    const [search, setSearch] = useState("")

    const [period, setPeriod] = useState<DateRangeValue>(() =>
        getDateRangeForPreset("current-month"),
    )

    const { startDate, endDate } = period

    const {
        data: report,
        isLoading,
        isError,
    } = useCategoryResultReport({
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
                description={`Analise receitas, despesas e resultado de ${formatDate(
                    report?.startDate,
                )} até ${formatDate(report?.endDate)}.`}
            />

            <section className="rounded-xl border bg-card p-4">
                <div className="space-y-5">
                    <DateRangePresetFilter
                        value={period}
                        onChange={setPeriod}
                        idPrefix="category-result-period"
                        label="Período analisado"
                        layout="full"
                        className="w-full"
                    />

                    <div className="border-t pt-4">
                        <div className="space-y-2">
                            <label
                                htmlFor="categorySearch"
                                className="text-sm font-medium"
                            >
                                Buscar categoria
                            </label>

                            <input
                                id="categorySearch"
                                type="search"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Digite o nome da categoria ou grupo..."
                                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                            />

                            {search && (
                                <p className="text-xs text-muted-foreground">
                                    Exibindo categorias que correspondem a “{search}”.
                                </p>
                            )}
                        </div>
                    </div>
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