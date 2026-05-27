import { useState } from "react"
import {
    ArrowDownCircle,
    ArrowLeft,
    ArrowUpCircle,
    Building2,
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
import type { AccountabilityByAccountReportItem, AccountabilityReportItem } from "@/features/reports/reports-types"
import { formatCurrency } from "@/utils/formatters"
import { useAccountabilityByAccountReport } from "@/features/reports/hooks/use-accountability-by-account-report"

const TEMP_ORGANIZATION_ID = "7b9ed617-92be-456d-81d6-dcde5841e7a0"

type AccountabilityBeneficiaryGroup = {
    beneficiaryId: string
    beneficiaryName: string
    allocatedAmount: number
    transferredAmount: number
    pendingAmount: number
    allocationCount: number
    funds: AccountabilityListItem[]
}

function getTodayDate() {
    return new Date().toISOString().slice(0, 10)
}

function getFirstDayOfCurrentMonth() {
    const today = new Date()

    return new Date(today.getFullYear(), today.getMonth(), 1)
        .toISOString()
        .slice(0, 10)
}

type AccountabilityListItem =
    | AccountabilityReportItem
    | AccountabilityByAccountReportItem

function filterAccountabilityItems(
    items: AccountabilityListItem[],
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

function sortAccountabilityItems(items: AccountabilityListItem[]) {
    return [...items].sort((a, b) => {
        const bPending = b.pendingAmount
        const aPending = a.pendingAmount

        if (bPending !== aPending) {
            return bPending - aPending
        }

        return a.beneficiaryName.localeCompare(b.beneficiaryName)
    })
}

function groupItemsByBeneficiary(
    items: AccountabilityListItem[],
): AccountabilityBeneficiaryGroup[] {
    const groups = new Map<string, AccountabilityBeneficiaryGroup>()

    for (const item of items) {
        const existingGroup = groups.get(item.beneficiaryId)

        if (!existingGroup) {
            groups.set(item.beneficiaryId, {
                beneficiaryId: item.beneficiaryId,
                beneficiaryName: item.beneficiaryName,
                allocatedAmount: item.allocatedAmount,
                transferredAmount: item.transferredAmount,
                pendingAmount: item.pendingAmount,
                allocationCount: item.allocationCount,
                funds: [item],
            })

            continue
        }

        existingGroup.allocatedAmount += item.allocatedAmount
        existingGroup.transferredAmount += item.transferredAmount
        existingGroup.pendingAmount += item.pendingAmount
        existingGroup.allocationCount += item.allocationCount
        existingGroup.funds.push(item)
    }

    const result = Array.from(groups.values())

    for (const group of result) {
        group.funds.sort((a, b) => {
            if (b.pendingAmount !== a.pendingAmount) {
                return b.pendingAmount - a.pendingAmount
            }

            return a.fundName.localeCompare(b.fundName)
        })
    }

    return result.sort((a, b) => {
        if (b.pendingAmount !== a.pendingAmount) {
            return b.pendingAmount - a.pendingAmount
        }

        return a.beneficiaryName.localeCompare(b.beneficiaryName)
    })
}

export function AccountabilityReportPage() {
    const [startDate, setStartDate] = useState(getFirstDayOfCurrentMonth)
    const [endDate, setEndDate] = useState(getTodayDate)
    const [search, setSearch] = useState("")
    const [showOnlyPending, setShowOnlyPending] = useState(false)
    const [showByAccount, setShowByAccount] = useState(false)

    const {
        data: report,
        isLoading,
        isError,
    } = useAccountabilityReport({
        organizationId: TEMP_ORGANIZATION_ID,
        startDate,
        endDate,
    })

    const {
        data: byAccountReport,
        isLoading: isByAccountLoading,
        isError: isByAccountError,
    } = useAccountabilityByAccountReport(
        {
            organizationId: TEMP_ORGANIZATION_ID,
            startDate,
            endDate,
        },
        showByAccount,
    )

    const currentItems = showByAccount
        ? byAccountReport?.items ?? []
        : report?.items ?? []

    const filteredItems = sortAccountabilityItems(
        filterAccountabilityItems(currentItems, search).filter((item) =>
            showOnlyPending ? item.pendingAmount > 0 : true,
        ),
    )

    const beneficiaryGroups = groupItemsByBeneficiary(filteredItems)

    if (isLoading || (showByAccount && isByAccountLoading)) {
        return <p>Carregando relatório...</p>
    }

    if (isError || (showByAccount && isByAccountError)) {
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
                <div className="grid gap-4 lg:grid-cols-[1fr_1fr_2fr_auto_auto] lg:items-end">
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

                    <Button
                        type="button"
                        variant={showByAccount ? "default" : "outline"}
                        onClick={() => setShowByAccount((current) => !current)}
                    >
                        <Building2 className="mr-2 size-4" />
                        {showByAccount ? "Visão por banco ativa" : "Ver por banco"}
                    </Button>
                </div>
            </section>

            <section className="space-y-4">
                <div>
                    <h2 className="text-lg font-semibold">
                        Saldos por favorecido
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {beneficiaryGroups.length} favorecidos encontrados em{" "}
                        {filteredItems.length} fundos.
                    </p>
                </div>

                {beneficiaryGroups.length === 0 ? (
                    <Card>
                        <CardContent className="p-8 text-center text-sm text-muted-foreground">
                            Nenhum registro encontrado para os filtros selecionados.
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 xl:grid-cols-2">
                        {beneficiaryGroups.map((group) => (
                            <AccountabilityBeneficiaryCard
                                key={group.beneficiaryId}
                                group={group}
                                showByAccount={showByAccount}
                            />
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}

type AccountabilityBeneficiaryCardProps = {
    group: AccountabilityBeneficiaryGroup
    showByAccount?: boolean
}

function AccountabilityBeneficiaryCard({
    group,
    showByAccount = false,
}: AccountabilityBeneficiaryCardProps) {
    const hasPending = group.pendingAmount > 0
    const hasOverpaid = group.pendingAmount < 0
    const totalMovement = group.allocatedAmount + group.transferredAmount
    const transferredPercentage =
        group.allocatedAmount > 0
            ? Math.min((group.transferredAmount / group.allocatedAmount) * 100, 100)
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
                                {group.beneficiaryName}
                            </CardTitle>
                            <p className="text-xs text-muted-foreground">
                                {group.funds.length} fundos • {group.allocationCount} alocações
                            </p>
                        </div>
                    </div>

                    <div className="text-right">
                        <p className="text-xs text-muted-foreground">A repassar</p>
                        <strong className="text-lg">
                            {formatCurrency(group.pendingAmount)}
                        </strong>
                    </div>
                </div>

                {hasPending && (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs">
                        Ainda existe valor destinado que não foi totalmente repassado ou utilizado para este favorecido.
                    </div>
                )}

                {hasOverpaid && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                        Os repasses ou utilizações ultrapassaram o valor destinado no período.
                    </div>
                )}
            </CardHeader>

            <CardContent className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                        <p className="text-xs text-muted-foreground">Destinado</p>
                        <p className="font-medium">
                            {formatCurrency(group.allocatedAmount)}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs text-muted-foreground">Repassado</p>
                        <p className="font-medium">
                            {formatCurrency(group.transferredAmount)}
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

                <div className="space-y-3 border-t pt-4">
                    <div>
                        <h4 className="text-sm font-medium">Fundos vinculados</h4>
                        <p className="text-xs text-muted-foreground">
                            Valores separados por fundo/projeto deste favorecido.
                        </p>
                    </div>

                    <div className="space-y-3">
                        {group.funds.map((fund) => (
                            <AccountabilityFundSection
                                key={`${fund.beneficiaryId}-${fund.fundId}`}
                                item={fund}
                                showByAccount={showByAccount}
                            />
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

type AccountabilityFundSectionProps = {
    item: AccountabilityListItem
    showByAccount?: boolean
}

function AccountabilityFundSection({
    item,
    showByAccount = false,
}: AccountabilityFundSectionProps) {
    const hasPending = item.pendingAmount > 0
    const hasOverpaid = item.pendingAmount < 0

    return (
        <div
            className={
                hasPending
                    ? "rounded-lg border border-amber-500/30 bg-amber-500/5 p-3"
                    : hasOverpaid
                        ? "rounded-lg border border-destructive/30 bg-destructive/5 p-3"
                        : "rounded-lg border bg-muted/20 p-3"
            }
        >
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                    <p className="text-sm font-medium">{item.fundName}</p>
                    <p className="text-xs text-muted-foreground">
                        {item.allocationCount} alocações
                    </p>
                </div>

                <div className="text-left md:text-right">
                    <p className="text-xs text-muted-foreground">A repassar</p>
                    <p className="text-sm font-semibold">
                        {formatCurrency(item.pendingAmount)}
                    </p>
                </div>
            </div>

            <div className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
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
                    <p className="text-xs text-muted-foreground">A repassar</p>
                    <p className="font-medium">
                        {formatCurrency(item.pendingAmount)}
                    </p>
                </div>
            </div>

            {showByAccount && "accounts" in item && item.accounts.length > 0 && (
                <div className="mt-4 space-y-3 border-t pt-3">
                    <div>
                        <h5 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Detalhamento por banco
                        </h5>
                        <p className="text-xs text-muted-foreground">
                            Valores agrupados pela conta/banco da transação original.
                        </p>
                    </div>

                    <div className="space-y-2">
                        {item.accounts.map((account) => (
                            <div
                                key={account.accountId}
                                className="rounded-lg border bg-background p-3"
                            >
                                <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <p className="text-sm font-medium">
                                            {account.accountName}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {account.bankName ?? "Banco não informado"} •{" "}
                                            {account.allocationCount} alocações
                                        </p>
                                    </div>

                                    <div className="text-sm font-semibold">
                                        {formatCurrency(account.pendingAmount)}
                                    </div>
                                </div>

                                <div className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Destinado
                                        </p>
                                        <p className="font-medium">
                                            {formatCurrency(account.allocatedAmount)}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Repassado
                                        </p>
                                        <p className="font-medium">
                                            {formatCurrency(account.transferredAmount)}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            A repassar
                                        </p>
                                        <p className="font-medium">
                                            {formatCurrency(account.pendingAmount)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}