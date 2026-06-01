import { useState } from "react"
import {
    ArrowLeft,
    ArrowDownCircle,
    ArrowUpCircle,
    FolderTree,
    Search,
    TrendingDown,
    Wallet,
} from "lucide-react"
import { Link } from "react-router-dom"

import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { useFundReport } from "@/features/reports/hooks/use-fund-report"
import type { FundReportItem } from "@/features/reports/reports-types"
import { formatCurrency } from "@/utils/formatters"
import { getFirstDayOfCurrentMonth, getTodayDate } from "@/utils/date-getters"

function filterFunds(items: FundReportItem[], search: string) {
    const normalizedSearch = search.trim().toLowerCase()

    if (!normalizedSearch) {
        return items
    }

    return items.filter((item) =>
        item.fundName.toLowerCase().includes(normalizedSearch),
    )
}

function sortFundsByPriority(items: FundReportItem[]) {
    return [...items].sort((a, b) => {
        const aIsNegative = a.currentBalance < 0
        const bIsNegative = b.currentBalance < 0

        if (aIsNegative && !bIsNegative) return -1
        if (!aIsNegative && bIsNegative) return 1

        return a.fundName.localeCompare(b.fundName)
    })
}

function filterNegativeFunds(
    items: FundReportItem[],
    showOnlyNegative: boolean,
) {
    if (!showOnlyNegative) {
        return items
    }

    return items.filter((item) => item.currentBalance < 0)
}

export function FundReportPage() {
    const [startDate, setStartDate] = useState(getFirstDayOfCurrentMonth)
    const [endDate, setEndDate] = useState(getTodayDate)
    const [search, setSearch] = useState("")
    const [showOnlyNegative, setShowOnlyNegative] = useState(false)

    const {
        data: report,
        isLoading,
        isError,
    } = useFundReport({
        startDate,
        endDate,
    })

    const filteredFunds = sortFundsByPriority(
        filterNegativeFunds(
            filterFunds(report?.items ?? [], search),
            showOnlyNegative,
        ),
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
                title="Fundos e Projetos"
                description={`Acompanhe entradas, saídas e saldo dos fundos de ${report?.startDate} até ${report?.endDate}.`}
            />

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Saldo total em fundos
                        </CardTitle>
                        <Wallet className="size-4 text-muted-foreground" />
                    </CardHeader>

                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(report?.fundsTotalBalance ?? 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Saldo atual considerando todas as alocações.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Entradas alocadas
                        </CardTitle>
                        <ArrowUpCircle className="size-4 text-muted-foreground" />
                    </CardHeader>

                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(report?.incomeAllocatedTotal ?? 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Entradas destinadas no período.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Saídas alocadas
                        </CardTitle>
                        <ArrowDownCircle className="size-4 text-muted-foreground" />
                    </CardHeader>

                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(report?.expenseAllocatedTotal ?? 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Saídas vinculadas aos fundos no período.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Fundos negativos
                        </CardTitle>
                        <TrendingDown className="size-4 text-muted-foreground" />
                    </CardHeader>

                    <CardContent>
                        <div className="text-2xl font-bold">
                            {report?.negativeFundsCount ?? 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Fundos com saldo atual abaixo de zero.
                        </p>
                    </CardContent>
                </Card>
            </section>

            <section className="rounded-xl border bg-card p-4">
                <div className="grid gap-4 lg:grid-cols-[1fr_1fr_2fr_auto] lg:items-end">
                    <div className="space-y-2">
                        <label htmlFor="startDate" className="text-sm font-medium">
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
                        <label htmlFor="endDate" className="text-sm font-medium">
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

                    <div className="space-y-2">
                        <label htmlFor="fundSearch" className="text-sm font-medium">
                            Buscar fundo
                        </label>

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                            <input
                                id="fundSearch"
                                type="search"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Digite o nome do fundo ou projeto..."
                                className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm"
                            />
                        </div>
                    </div>

                    <Button
                        type="button"
                        variant={showOnlyNegative ? "default" : "outline"}
                        onClick={() => setShowOnlyNegative((current) => !current)}
                    >
                        {showOnlyNegative ? "Mostrando negativos" : "Somente negativos"}
                    </Button>
                </div>
            </section>

            <section className="space-y-4">
                <div>
                    <h2 className="text-lg font-semibold">Fundos no período</h2>
                    <p className="text-sm text-muted-foreground">
                        {filteredFunds.length} fundos encontrados.
                    </p>
                </div>

                {filteredFunds.length === 0 ? (
                    <Card>
                        <CardContent className="p-8 text-center text-sm text-muted-foreground">
                            Nenhum fundo encontrado para os filtros selecionados.
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 xl:grid-cols-2">
                        {filteredFunds.map((fund) => (
                            <FundReportCard key={fund.fundId} fund={fund} />
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}

type FundReportCardProps = {
    fund: FundReportItem
}

function FundReportCard({ fund }: FundReportCardProps) {
    const isNegative = fund.currentBalance < 0
    const totalMovement = fund.incomeAllocated + fund.expenseAllocated
    const incomePercentage =
        totalMovement > 0 ? (fund.incomeAllocated / totalMovement) * 100 : 0

    return (
        <Card className={isNegative ? "border-destructive/50" : ""}>
            <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="rounded-xl bg-muted p-2">
                            <FolderTree className="size-5 text-muted-foreground" />
                        </div>

                        <div>
                            <CardTitle className="text-base">{fund.fundName}</CardTitle>
                            <p className="text-xs text-muted-foreground">
                                {fund.allocationCount} alocações no período
                            </p>
                        </div>
                    </div>

                    <div className="text-right">
                        <p className="text-xs text-muted-foreground">Saldo atual</p>
                        <strong
                            className={
                                isNegative ? "text-lg text-destructive" : "text-lg"
                            }
                        >
                            {formatCurrency(fund.currentBalance)}
                        </strong>
                    </div>
                </div>

                {isNegative && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                        Este fundo está com saldo negativo.
                    </div>
                )}
            </CardHeader>

            <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                        <p className="text-xs text-muted-foreground">Entradas</p>
                        <p className="font-medium">
                            {formatCurrency(fund.incomeAllocated)}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs text-muted-foreground">Saídas</p>
                        <p className="font-medium">
                            {formatCurrency(fund.expenseAllocated)}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs text-muted-foreground">Resultado</p>
                        <p className="font-medium">
                            {formatCurrency(fund.periodBalance)}
                        </p>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Composição do movimento</span>
                        <span>{formatCurrency(totalMovement)}</span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                            className="h-full bg-foreground"
                            style={{ width: `${incomePercentage}%` }}
                        />
                    </div>

                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Entradas</span>
                        <span>Saídas</span>
                    </div>
                </div>

                <Button asChild variant="outline" className="w-full">
                    <Link to={`/transactions?fundId=${fund.fundId}`}>
                        Ver transações deste fundo
                    </Link>
                </Button>
            </CardContent>
        </Card>
    )
}