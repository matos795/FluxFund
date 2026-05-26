import { useState } from "react"
import {
    ArrowDownCircle,
    ArrowLeft,
    ArrowUpCircle,
    HandCoins,
    Search,
    UserRound,
    WalletCards,
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
import { useAccountabilityReport } from "@/features/reports/hooks/use-accountability-report"
import type { AccountabilityReportItem } from "@/features/reports/reports-types"
import { formatCurrency } from "@/utils/formatters"

const TEMP_ORGANIZATION_ID = "7b9ed617-92be-456d-81d6-dcde5841e7a0"

function getTodayDate() {
    return new Date().toISOString().slice(0, 10)
}

function getFirstDayOfCurrentMonth() {
    const today = new Date()

    return new Date(today.getFullYear(), today.getMonth(), 1)
        .toISOString()
        .slice(0, 10)
}

function filterAccountabilityItems(
    items: AccountabilityReportItem[],
    search: string,
) {
    const normalizedSearch = search.trim().toLowerCase()

    if (!normalizedSearch) {
        return items
    }

    return items.filter((item) => {
        return (
            item.beneficiaryName.toLowerCase().includes(normalizedSearch) ||
            item.fundName.toLowerCase().includes(normalizedSearch)
        )
    })
}

function sortAccountabilityItems(items: AccountabilityReportItem[]) {
    return [...items].sort((a, b) => {
        const bPending = b.pendingAmount
        const aPending = a.pendingAmount

        if (bPending !== aPending) {
            return bPending - aPending
        }

        return a.beneficiaryName.localeCompare(b.beneficiaryName)
    })
}

export function AccountabilityReportPage() {
    const [startDate, setStartDate] = useState(getFirstDayOfCurrentMonth)
    const [endDate, setEndDate] = useState(getTodayDate)
    const [search, setSearch] = useState("")
    const [showOnlyPending, setShowOnlyPending] = useState(false)

    const {
        data: report,
        isLoading,
        isError,
    } = useAccountabilityReport({
        organizationId: TEMP_ORGANIZATION_ID,
        startDate,
        endDate,
    })

    const filteredItems = sortAccountabilityItems(
        filterAccountabilityItems(report?.items ?? [], search).filter((item) =>
            showOnlyPending ? item.pendingAmount > 0 : true,
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
                title="Prestação de Contas / Sustento"
                description={`Acompanhe valores destinados a favorecidos e o quanto já foi repassado ou utilizado de ${report?.startDate} até ${report?.endDate}.`}
            />

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total destinado
                        </CardTitle>
                        <ArrowUpCircle className="size-4 text-muted-foreground" />
                    </CardHeader>

                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(report?.allocatedTotal ?? 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Valores destinados aos favorecidos.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total repassado/utilizado
                        </CardTitle>
                        <ArrowDownCircle className="size-4 text-muted-foreground" />
                    </CardHeader>

                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(report?.transferredTotal ?? 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Valores já repassados ou utilizados.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Saldo a repassar
                        </CardTitle>
                        <WalletCards className="size-4 text-muted-foreground" />
                    </CardHeader>

                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(report?.pendingTotal ?? 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Valores destinados que ainda não foram totalmente repassados ou utilizados.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Com saldo a repassar
                        </CardTitle>
                        <UserRound className="size-4 text-muted-foreground" />
                    </CardHeader>

                    <CardContent>
                        <div className="text-2xl font-bold">
                            {report?.beneficiariesWithPendingBalance ?? 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Favorecidos com valor destinado ainda em aberto.
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
                        <label htmlFor="accountabilitySearch" className="text-sm font-medium">
                            Buscar
                        </label>

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                            <input
                                id="accountabilitySearch"
                                type="search"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Buscar por favorecido ou fundo..."
                                className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm"
                            />
                        </div>
                    </div>

                    <Button
                        type="button"
                        variant={showOnlyPending ? "default" : "outline"}
                        onClick={() => setShowOnlyPending((current) => !current)}
                    >
                        {showOnlyPending ? "Mostrando saldos a repassar" : "Somente saldos a repassar"}
                    </Button>
                </div>
            </section>

            <section className="space-y-4">
                <div>
                    <h2 className="text-lg font-semibold">
                        Saldos por favorecido e fundo
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {filteredItems.length} registros encontrados.
                    </p>
                </div>

                {filteredItems.length === 0 ? (
                    <Card>
                        <CardContent className="p-8 text-center text-sm text-muted-foreground">
                            Nenhum registro encontrado para os filtros selecionados.
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 xl:grid-cols-2">
                        {filteredItems.map((item) => (
                            <AccountabilityReportCard
                                key={`${item.beneficiaryId}-${item.fundId}`}
                                item={item}
                            />
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}

type AccountabilityReportCardProps = {
    item: AccountabilityReportItem
}

function AccountabilityReportCard({ item }: AccountabilityReportCardProps) {
    const hasPending = item.pendingAmount > 0
    const hasOverpaid = item.pendingAmount < 0
    const totalMovement = item.allocatedAmount + item.transferredAmount
    const transferredPercentage =
        item.allocatedAmount > 0
            ? Math.min((item.transferredAmount / item.allocatedAmount) * 100, 100)
            : 0

    return (
        <Card
            className={
                hasPending
                    ? "border-amber-500/40"
                    : hasOverpaid
                        ? "border-destructive/40"
                        : ""
            }
        >
            <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="rounded-xl bg-muted p-2">
                            <HandCoins className="size-5 text-muted-foreground" />
                        </div>

                        <div>
                            <CardTitle className="text-base">
                                {item.beneficiaryName}
                            </CardTitle>
                            <p className="text-xs text-muted-foreground">
                                {item.fundName} • {item.allocationCount} alocações
                            </p>
                        </div>
                    </div>

                    <div className="text-right">
                        <p className="text-xs text-muted-foreground">A repassar</p>
                        <strong className="text-lg">
                            {formatCurrency(item.pendingAmount)}
                        </strong>
                    </div>
                </div>

                {hasPending && (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs">
                        Ainda existe valor destinado que não foi totalmente repassado ou utilizado neste fundo.
                    </div>
                )}

                {hasOverpaid && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                        Os repasses ou utilizações ultrapassaram o valor destinado no período.
                    </div>
                )}
            </CardHeader>

            <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                        <p className="text-xs text-muted-foreground">Destinado</p>
                        <p className="font-medium">
                            {formatCurrency(item.allocatedAmount)}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs text-muted-foreground">Repassado</p>
                        <p className="font-medium">
                            {formatCurrency(item.transferredAmount)}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs text-muted-foreground">Movimento</p>
                        <p className="font-medium">
                            {formatCurrency(totalMovement)}
                        </p>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progresso do repasse</span>
                        <span>{transferredPercentage.toFixed(0)}%</span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                            className="h-full bg-foreground"
                            style={{ width: `${transferredPercentage}%` }}
                        />
                    </div>

                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Destinado</span>
                        <span>Repassado</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}