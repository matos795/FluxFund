import { useState } from "react"
import {
    ArrowDownCircle,
    ArrowLeft,
    ArrowUpCircle,
    Building2,
    ChevronDown,
    ChevronRight,
    ChevronsDown,
    ChevronsUp,
    FileSpreadsheet,
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
import { formatCurrency, formatDate } from "@/utils/formatters"
import { useAccountabilityByAccountReport } from "@/features/reports/hooks/use-accountability-by-account-report"
import { useExportAccountabilityExcel } from "@/features/reports/hooks/use-export-accountability-excel"
import { downloadFile } from "@/utils/download-file"
import { toast } from "sonner"

const TEMP_ORGANIZATION_ID = "7b9ed617-92be-456d-81d6-dcde5841e7a0"

type AccountabilityBeneficiaryGroup = {
    beneficiaryId: string
    beneficiaryName: string
    allocatedAmount: number
    transferredAmount: number
    commitmentAmount: number
    payableAmount: number
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

function buildBeneficiaryFundKey(beneficiaryId: string, fundId: string) {
    return `${beneficiaryId}:${fundId}`
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
                commitmentAmount: item.commitmentAmount,
                payableAmount: item.payableAmount,
                pendingAmount: item.pendingAmount,
                allocationCount: item.allocationCount,
                funds: [item],
            })

            continue
        }

        existingGroup.allocatedAmount += item.allocatedAmount
        existingGroup.transferredAmount += item.transferredAmount
        existingGroup.commitmentAmount += item.commitmentAmount
        existingGroup.payableAmount += item.payableAmount
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

    const [expandedBeneficiaryIds, setExpandedBeneficiaryIds] = useState<Set<string>>(
        () => new Set(),
    )

    const [expandedBankFundKeys, setExpandedBankFundKeys] = useState<Set<string>>(
        () => new Set(),
    )

    const [shouldLoadBankDetails, setShouldLoadBankDetails] = useState(false)

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
        shouldLoadBankDetails,
    )

    const exportAccountabilityExcelMutation = useExportAccountabilityExcel()

    const currentItems = report?.items ?? []

    const filteredItems = sortAccountabilityItems(
        filterAccountabilityItems(currentItems, search).filter((item) =>
            showOnlyPending ? item.pendingAmount > 0 : true,
        ),
    )

    const beneficiaryGroups = groupItemsByBeneficiary(filteredItems)

    const byAccountItemsByFundKey = new Map<string, AccountabilityByAccountReportItem>()

    for (const item of byAccountReport?.items ?? []) {
        byAccountItemsByFundKey.set(
            buildBeneficiaryFundKey(item.beneficiaryId, item.fundId),
            item,
        )
    }

    function toggleBeneficiaryFunds(beneficiaryId: string) {
        setExpandedBeneficiaryIds((current) => {
            const next = new Set(current)

            if (next.has(beneficiaryId)) {
                next.delete(beneficiaryId)
            } else {
                next.add(beneficiaryId)
            }

            return next
        })
    }

    function toggleFundBanks(beneficiaryId: string, fundId: string) {
        setShouldLoadBankDetails(true)

        const key = buildBeneficiaryFundKey(beneficiaryId, fundId)

        setExpandedBankFundKeys((current) => {
            const next = new Set(current)

            if (next.has(key)) {
                next.delete(key)
            } else {
                next.add(key)
            }

            return next
        })
    }

    function expandAllBeneficiaries() {
        setShouldLoadBankDetails(true)

        setExpandedBeneficiaryIds(
            new Set(beneficiaryGroups.map((group) => group.beneficiaryId)),
        )
    }

    function collapseAllBeneficiaries() {
        setExpandedBeneficiaryIds(new Set())
        setExpandedBankFundKeys(new Set())
    }

    function handleExportExcel() {
        exportAccountabilityExcelMutation.mutate(
            {
                organizationId: TEMP_ORGANIZATION_ID,
                startDate,
                endDate,
            },
            {
                onSuccess: (blob) => {
                    const filenameStartDate = startDate || "inicio"
                    const filenameEndDate = endDate || "fim"

                    const filename = `prestacao-contas-${filenameStartDate}-${filenameEndDate}.xlsx`

                    downloadFile(blob, filename)

                    toast.success("Relatório exportado com sucesso.")
                },
                onError: () => {
                    toast.error("Não foi possível exportar o relatório.")
                },
            },
        )
    }

    const hasBeneficiaryGroups = beneficiaryGroups.length > 0
    const allBeneficiariesExpanded =
        hasBeneficiaryGroups &&
        beneficiaryGroups.every((group) =>
            expandedBeneficiaryIds.has(group.beneficiaryId),
        )

    const hasAnyExpandedBeneficiary = expandedBeneficiaryIds.size > 0

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
                description={`Acompanhe compromissos fixos, ofertas destinadas e repasses de ${formatDate(report?.startDate)} até ${formatDate(report?.endDate)}.`}
            />

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Compromissos fixos
                        </CardTitle>
                        <HandCoins className="size-4 text-muted-foreground" />
                    </CardHeader>

                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(report?.commitmentTotal ?? 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Sustentos fixos previstos no período.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Ofertas destinadas
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
                            Total devido
                        </CardTitle>
                        <WalletCards className="size-4 text-muted-foreground" />
                    </CardHeader>

                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(report?.payableTotal ?? 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Compromissos fixos mais ofertas destinadas.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Repassado/utilizado
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
                            A repassar
                        </CardTitle>
                        <UserRound className="size-4 text-muted-foreground" />
                    </CardHeader>

                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(report?.pendingTotal ?? 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Total devido menos o que já foi repassado.
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
                        variant="outline"
                        onClick={handleExportExcel}
                        disabled={exportAccountabilityExcelMutation.isPending}
                    >
                        <FileSpreadsheet className="mr-2 size-4" />
                        {exportAccountabilityExcelMutation.isPending
                            ? "Exportando..."
                            : "Exportar Excel"}
                    </Button>
                </div>
            </section>

            <section className="space-y-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold">
                            Prestação por favorecido
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {beneficiaryGroups.length} favorecidos encontrados em{" "}
                            {filteredItems.length} fundos.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={expandAllBeneficiaries}
                            disabled={!hasBeneficiaryGroups || allBeneficiariesExpanded}
                        >
                            <ChevronsDown className="mr-2 size-4" />
                            Expandir tudo
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={collapseAllBeneficiaries}
                            disabled={!hasAnyExpandedBeneficiary}
                        >
                            <ChevronsUp className="mr-2 size-4" />
                            Recolher tudo
                        </Button>
                    </div>
                </div>

                {beneficiaryGroups.length === 0 ? (
                    <Card>
                        <CardContent className="p-8 text-center text-sm text-muted-foreground">
                            Nenhum registro encontrado para os filtros selecionados.
                        </CardContent>
                    </Card>
                ) : (
                    <div className="columns-1 gap-4 xl:columns-2">
                        {beneficiaryGroups.map((group) => (
                            <AccountabilityBeneficiaryCard
                                key={group.beneficiaryId}
                                group={group}
                                isExpanded={expandedBeneficiaryIds.has(group.beneficiaryId)}
                                expandedBankFundKeys={expandedBankFundKeys}
                                byAccountItemsByFundKey={byAccountItemsByFundKey}
                                isByAccountLoading={isByAccountLoading}
                                isByAccountError={isByAccountError}
                                onToggleFunds={() => toggleBeneficiaryFunds(group.beneficiaryId)}
                                onToggleFundBanks={toggleFundBanks}
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
    isExpanded: boolean
    expandedBankFundKeys: Set<string>
    byAccountItemsByFundKey: Map<string, AccountabilityByAccountReportItem>
    isByAccountLoading: boolean
    isByAccountError: boolean
    onToggleFunds: () => void
    onToggleFundBanks: (beneficiaryId: string, fundId: string) => void
}

function AccountabilityBeneficiaryCard({
    group,
    isExpanded,
    expandedBankFundKeys,
    byAccountItemsByFundKey,
    isByAccountLoading,
    isByAccountError,
    onToggleFunds,
    onToggleFundBanks,
}: AccountabilityBeneficiaryCardProps) {
    const hasPending = group.pendingAmount > 0
    const hasOverpaid = group.pendingAmount < 0

    const transferredPercentage =
        group.payableAmount > 0
            ? Math.min((group.transferredAmount / group.payableAmount) * 100, 100)
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
                        Ainda existe valor a repassar para este favorecido considerando compromissos fixos e ofertas destinadas.
                    </div>
                )}

                {hasOverpaid && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                        Os repasses ultrapassaram o total devido no período.
                    </div>
                )}
            </CardHeader>

            <CardContent className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-5">
                    <div>
                        <p className="text-xs text-muted-foreground">Compromisso</p>
                        <p className="font-medium">
                            {formatCurrency(group.commitmentAmount)}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs text-muted-foreground">Ofertas</p>
                        <p className="font-medium">
                            {formatCurrency(group.allocatedAmount)}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs text-muted-foreground">Total devido</p>
                        <p className="font-medium">
                            {formatCurrency(group.payableAmount)}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs text-muted-foreground">Repassado</p>
                        <p className="font-medium">
                            {formatCurrency(group.transferredAmount)}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs text-muted-foreground">A repassar</p>
                        <p className="font-medium">
                            {formatCurrency(group.pendingAmount)}
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
                        <span>Total devido</span>
                        <span>Repassado</span>
                    </div>
                </div>

                <div className="space-y-3 border-t pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-between"
                        onClick={onToggleFunds}
                    >
                        <span>
                            {isExpanded ? "Ocultar fundos" : "Ver fundos"} ({group.funds.length})
                        </span>

                        {isExpanded ? (
                            <ChevronDown className="size-4" />
                        ) : (
                            <ChevronRight className="size-4" />
                        )}
                    </Button>

                    {isExpanded && (
                        <div className="space-y-3">
                            {group.funds.map((fund) => {
                                const fundKey = buildBeneficiaryFundKey(
                                    fund.beneficiaryId,
                                    fund.fundId,
                                )

                                const byAccountItem = byAccountItemsByFundKey.get(fundKey)
                                const isBankExpanded = expandedBankFundKeys.has(fundKey)

                                return (
                                    <AccountabilityFundSection
                                        key={fundKey}
                                        item={fund}
                                        byAccountItem={byAccountItem}
                                        isBankExpanded={isBankExpanded}
                                        isByAccountLoading={isByAccountLoading}
                                        isByAccountError={isByAccountError}
                                        onToggleBanks={() =>
                                            onToggleFundBanks(fund.beneficiaryId, fund.fundId)
                                        }
                                    />
                                )
                            })}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

type AccountabilityFundSectionProps = {
    item: AccountabilityListItem
    byAccountItem?: AccountabilityByAccountReportItem
    isBankExpanded: boolean
    isByAccountLoading: boolean
    isByAccountError: boolean
    onToggleBanks: () => void
}

function AccountabilityFundSection({
    item,
    byAccountItem,
    isBankExpanded,
    isByAccountLoading,
    isByAccountError,
    onToggleBanks,
}: AccountabilityFundSectionProps) {
    const hasPending = item.pendingAmount > 0
    const hasOverpaid = item.pendingAmount < 0
    const bankCount = byAccountItem?.accounts.length

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

            <div className="mt-3 grid gap-3 text-sm sm:grid-cols-5">
                <div>
                    <p className="text-xs text-muted-foreground">Compromisso</p>
                    <p className="font-medium">
                        {formatCurrency(item.commitmentAmount)}
                    </p>
                </div>

                <div>
                    <p className="text-xs text-muted-foreground">Ofertas</p>
                    <p className="font-medium">
                        {formatCurrency(item.allocatedAmount)}
                    </p>
                </div>

                <div>
                    <p className="text-xs text-muted-foreground">Total devido</p>
                    <p className="font-medium">
                        {formatCurrency(item.payableAmount)}
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

            <div className="mt-4 border-t pt-3">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between px-0"
                    onClick={onToggleBanks}
                >
                    <span className="flex items-center">
                        <Building2 className="mr-2 size-4" />
                        {isByAccountLoading && bankCount === undefined
                            ? "Carregando bancos..."
                            : isBankExpanded
                                ? `Ocultar bancos (${bankCount ?? 0})`
                                : `Ver bancos (${bankCount ?? 0})`}
                    </span>

                    {isBankExpanded ? (
                        <ChevronDown className="size-4" />
                    ) : (
                        <ChevronRight className="size-4" />
                    )}
                </Button>

                {isBankExpanded && (
                    <div className="mt-3 space-y-3">
                        {isByAccountLoading ? (
                            <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                                Carregando detalhamento por banco...
                            </div>
                        ) : isByAccountError ? (
                            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                                Não foi possível carregar o detalhamento por banco.
                            </div>
                        ) : !byAccountItem || byAccountItem.accounts.length === 0 ? (
                            <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                                Nenhuma movimentação bancária encontrada para este fundo no período.
                            </div>
                        ) : (
                            <>
                                <div>
                                    <h5 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        Detalhamento por banco
                                    </h5>
                                    <p className="text-xs text-muted-foreground">
                                        Bancos mostram movimentação real de ofertas e repasses.
                                        O compromisso fixo não pertence a um banco específico.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    {byAccountItem.accounts.map((account) => (
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
                                                        Ofertas
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
                                                        Saldo no banco
                                                    </p>
                                                    <p className="font-medium">
                                                        {formatCurrency(account.pendingAmount)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}