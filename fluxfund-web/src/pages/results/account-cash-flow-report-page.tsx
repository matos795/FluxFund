import { useMemo, useState, type ComponentType } from "react"
import {
    ArrowDownCircle,
    ArrowLeft,
    ArrowRightLeft,
    ArrowUpCircle,
    FileText,
    Landmark,
    Search,
    TrendingDown,
    TrendingUp,
    Wallet,
} from "lucide-react"
import { Link } from "react-router-dom"
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts"

import { PageHeader } from "@/components/layout/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useAccountCashFlowReport } from "@/features/reports/hooks/use-account-cash-flow-report"
import type { AccountCashFlowItem } from "@/features/reports/reports-types"
import { formatCurrency, formatDate } from "@/utils/formatters"
import { getDateRangeForPreset, type DateRangeValue } from "@/components/filters/date-range-presets"
import { DateRangePresetFilter } from "@/components/filters/date-range-preset-filter"
import { useExportAccountMovementPdf } from "@/features/reports/hooks/use-export-account-movement-pdf"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/utils/api-error"
import { downloadFile } from "@/utils/download-file"

const accountTypeLabels: Record<AccountCashFlowItem["accountType"], string> = {
    BANK: "Banco",
    CASH: "Caixa",
    DIGITAL_WALLET: "Conta digital",
    CREDIT_CARD: "Cartão",
    OTHER: "Outro",
}

type ChartAccountItem = AccountCashFlowItem & {
    label: string
    movementAmount: number
}

type TooltipPayloadItem = {
    name?: string
    value?: number
    dataKey?: string
    payload?: ChartAccountItem
}

type CurrencyTooltipProps = {
    active?: boolean
    label?: string
    payload?: TooltipPayloadItem[]
}

function filterAccounts(items: AccountCashFlowItem[], search: string) {
    const normalizedSearch = search.trim().toLowerCase()

    if (!normalizedSearch) {
        return items
    }

    return items.filter((item) => {
        const accountName = item.accountName.toLowerCase()
        const bankName = item.bankName?.toLowerCase() ?? ""
        const accountType = accountTypeLabels[item.accountType].toLowerCase()

        return (
            accountName.includes(normalizedSearch) ||
            bankName.includes(normalizedSearch) ||
            accountType.includes(normalizedSearch)
        )
    })
}

function sortAccounts(items: AccountCashFlowItem[]) {
    return [...items].sort((a, b) => {
        const aHasMovement = a.transactionCount > 0
        const bHasMovement = b.transactionCount > 0

        if (aHasMovement && !bHasMovement) return -1
        if (!aHasMovement && bHasMovement) return 1

        return Math.abs(b.closingBalance) - Math.abs(a.closingBalance)
    })
}

function toChartLabel(name: string) {
    if (name.length <= 18) {
        return name
    }

    return `${name.slice(0, 18)}…`
}

function getMovementAmount(item: AccountCashFlowItem) {
    return item.incomeAmount + item.expenseAmount + item.transferAmount
}

function getPositiveOrNegativeLabel(value: number) {
    if (value > 0) {
        return "Resultado positivo"
    }

    if (value < 0) {
        return "Resultado negativo"
    }

    return "Resultado zerado"
}

function CurrencyTooltip({ active, payload, label }: CurrencyTooltipProps) {
    if (!active || !payload || payload.length === 0) {
        return null
    }

    return (
        <div className="rounded-lg border bg-background p-3 text-sm shadow-sm">
            <p className="mb-2 font-medium">{label}</p>

            <div className="space-y-1">
                {payload.map((item) => (
                    <div key={item.dataKey} className="flex items-center justify-between gap-6">
                        <span className="text-muted-foreground">{item.name}</span>
                        <span className="font-medium">
                            {formatCurrency(Number(item.value ?? 0))}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}

export function AccountCashFlowReportPage() {
    const [period, setPeriod] = useState<DateRangeValue>(() =>
        getDateRangeForPreset("current-month"),
    )

    const { startDate, endDate } = period

    const exportAccountMovementPdfMutation = useExportAccountMovementPdf()

    const hasValidPeriod =
        Boolean(startDate) &&
        Boolean(endDate) &&
        startDate <= endDate

    const [search, setSearch] = useState("")

    const {
        data: report,
        isLoading,
        isError,
    } = useAccountCashFlowReport({
        startDate,
        endDate,
    })

    const filteredAccounts = useMemo(
        () => sortAccounts(filterAccounts(report?.items ?? [], search)),
        [report?.items, search],
    )

    const accountsWithAnyValue = useMemo(
        () =>
            (report?.items ?? []).filter(
                (item) =>
                    item.transactionCount > 0 ||
                    item.openingBalance !== 0 ||
                    item.closingBalance !== 0,
            ),
        [report?.items],
    )

    const movementChartData = useMemo<ChartAccountItem[]>(
        () =>
            [...accountsWithAnyValue]
                .sort((a, b) => getMovementAmount(b) - getMovementAmount(a))
                .slice(0, 8)
                .map((item) => ({
                    ...item,
                    label: toChartLabel(item.accountName),
                    movementAmount: getMovementAmount(item),
                })),
        [accountsWithAnyValue],
    )

    const balanceChartData = useMemo<ChartAccountItem[]>(
        () =>
            [...accountsWithAnyValue]
                .sort((a, b) => Math.abs(b.currentBalance) - Math.abs(a.currentBalance))
                .slice(0, 8)
                .map((item) => ({
                    ...item,
                    label: toChartLabel(item.accountName),
                    movementAmount: getMovementAmount(item),
                })),
        [accountsWithAnyValue],
    )

    const biggestIncomeAccount = useMemo(
        () =>
            [...(report?.items ?? [])].sort(
                (a, b) => b.incomeAmount - a.incomeAmount,
            )[0],
        [report?.items],
    )

    const biggestExpenseAccount = useMemo(
        () =>
            [...(report?.items ?? [])].sort(
                (a, b) => b.expenseAmount - a.expenseAmount,
            )[0],
        [report?.items],
    )

    const biggestBalanceAccount = useMemo(
        () =>
            [...(report?.items ?? [])].sort(
                (a, b) => b.currentBalance - a.currentBalance,
            )[0],
        [report?.items],
    )

    const negativeAccounts = useMemo(
        () => (report?.items ?? []).filter((item) => item.currentBalance < 0),
        [report?.items],
    )

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Button asChild variant="ghost" className="px-0">
                    <Link to="/reports">
                        <ArrowLeft className="mr-2 size-4" />
                        Voltar para relatórios
                    </Link>
                </Button>

                <div className="rounded-lg border p-6 text-sm text-muted-foreground">
                    Carregando relatório de fluxo de caixa...
                </div>
            </div>
        )
    }

    if (isError || !report) {
        return (
            <div className="space-y-4">
                <Button asChild variant="ghost" className="px-0">
                    <Link to="/reports">
                        <ArrowLeft className="mr-2 size-4" />
                        Voltar para relatórios
                    </Link>
                </Button>

                <div className="rounded-lg border p-6 text-sm text-destructive">
                    Não foi possível carregar o relatório de fluxo de caixa.
                </div>
            </div>
        )
    }

    const netIsPositive = report.netTotal >= 0

    function handleExportAccountMovementPdf(
        account: AccountCashFlowItem,
    ) {
        if (!hasValidPeriod) {
            toast.error("Informe um período válido para exportar o PDF.")
            return
        }

        if (account.accountType === "CREDIT_CARD") {
            toast.info(
                "Use o relatório de fatura para contas do tipo cartão de crédito.",
            )
            return
        }

        exportAccountMovementPdfMutation.mutate(
            {
                accountId: account.accountId,
                startDate,
                endDate,
            },
            {
                onSuccess: (blob) => {
                    downloadFile(
                        blob,
                        `movimentacao-conta-${startDate}-${endDate}.pdf`,
                    )

                    toast.success(
                        `Movimentação da conta "${account.accountName}" exportada com sucesso.`,
                    )
                },
                onError: (error) => {
                    toast.error(
                        getApiErrorMessage(
                            error,
                            "Não foi possível exportar a movimentação da conta.",
                        ),
                    )
                },
            },
        )
    }

    return (
        <div className="space-y-4">
            <Button asChild variant="ghost" className="px-0">
                <Link to="/reports">
                    <ArrowLeft className="mr-2 size-4" />
                    Voltar para relatórios
                </Link>
            </Button>

            <div className="space-y-3">
                <PageHeader
                    title="Fluxo de Caixa por Conta"
                    description={`Visão do dinheiro real por conta entre ${formatDate(
                        report.startDate,
                    )} e ${formatDate(report.endDate)}.`}
                />

                <section className="rounded-xl border bg-card p-4">
                    <div className="space-y-4">
                        <DateRangePresetFilter
                            value={period}
                            onChange={setPeriod}
                            idPrefix="account-cash-flow-period"
                            label="Período do fluxo"
                        />

                        <div className="grid gap-4 md:grid-cols-[minmax(280px,1fr)_auto] md:items-end">
                            <div className="space-y-2">
                                <label
                                    htmlFor="accountSearch"
                                    className="text-sm font-medium"
                                >
                                    Buscar conta
                                </label>

                                <div className="relative">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                                    <Input
                                        id="accountSearch"
                                        type="search"
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        placeholder="Banco, conta, caixa..."
                                        className="pl-9"
                                    />
                                </div>
                            </div>

                            <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                                {filteredAccounts.length} conta(s) encontrada(s)
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <section className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)]">
                <Card className="overflow-hidden">
                    <CardContent className="p-0">
                        <div className="bg-gradient-to-br from-primary/10 via-background to-muted/60 p-6">
                            <div className="flex min-w-0 flex-col gap-6 2xl:flex-row 2xl:items-end 2xl:justify-between">
                                <div className="space-y-2">
                                    <Badge variant={netIsPositive ? "default" : "destructive"}>
                                        {getPositiveOrNegativeLabel(report.netTotal)}
                                    </Badge>

                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            Saldo atual das contas
                                        </p>

                                        <p className="mt-1 break-words text-3xl font-bold tracking-tight sm:text-4xl 2xl:text-5xl">
                                            {formatCurrency(report.currentBalanceTotal)}
                                        </p>
                                    </div>

                                    <p className="max-w-2xl text-sm text-muted-foreground">
                                        Este saldo atual é independente do filtro de período. O filtro abaixo
                                        controla apenas entradas, saídas, resultado e saldo no fim do período.
                                    </p>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2 2xl:w-[420px] 2xl:shrink-0">
                                    <HeroMiniMetric
                                        label="Início do período"
                                        value={report.openingBalanceTotal}
                                    />

                                    <HeroMiniMetric
                                        label="Fim do período"
                                        value={report.closingBalanceTotal}
                                    />

                                    <HeroMiniMetric
                                        label="Resultado"
                                        value={report.netTotal}
                                        highlight={netIsPositive ? "positive" : "negative"}
                                    />

                                    <HeroMiniMetric
                                        label="Movimentações"
                                        value={report.transactionCount}
                                        integer
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Leitura rápida</CardTitle>
                        <CardDescription>
                            Principais destaques do período selecionado.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <InsightRow
                            label="Maior entrada"
                            account={biggestIncomeAccount}
                            value={biggestIncomeAccount?.incomeAmount ?? 0}
                            icon={ArrowUpCircle}
                        />

                        <InsightRow
                            label="Maior saída"
                            account={biggestExpenseAccount}
                            value={biggestExpenseAccount?.expenseAmount ?? 0}
                            icon={ArrowDownCircle}
                        />

                        <InsightRow
                            label="Maior saldo final"
                            account={biggestBalanceAccount}
                            value={biggestBalanceAccount?.currentBalance ?? 0}
                            icon={Landmark}
                        />

                        <div className="rounded-lg border p-3">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm font-medium">Contas negativas</p>
                                    <p className="text-xs text-muted-foreground">
                                        Contas reais com saldo calculado abaixo de zero.
                                    </p>
                                </div>

                                <Badge variant={negativeAccounts.length > 0 ? "destructive" : "secondary"}>
                                    {negativeAccounts.length}
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
                <MetricCard
                    title="Saldo atual"
                    value={report.currentBalanceTotal}
                    description="Independente do filtro"
                    icon={Landmark}
                />

                <MetricCard
                    title="Início do período"
                    value={report.openingBalanceTotal}
                    description="Antes da data inicial"
                    icon={Wallet}
                />

                <MetricCard
                    title="Entradas"
                    value={report.incomeTotal}
                    description="Receitas liquidadas"
                    icon={ArrowUpCircle}
                />

                <MetricCard
                    title="Saídas"
                    value={report.expenseTotal}
                    description="Despesas liquidadas"
                    icon={ArrowDownCircle}
                />

                <MetricCard
                    title="Transferências"
                    value={report.transferTotal}
                    description="Movimentação neutra"
                    icon={ArrowRightLeft}
                />

                <MetricCard
                    title="Resultado"
                    value={report.netTotal}
                    description="Entradas - saídas"
                    icon={netIsPositive ? TrendingUp : TrendingDown}
                    variant={netIsPositive ? "positive" : "negative"}
                />
            </section>

            <section className="grid gap-4 xl:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Entradas x Saídas por conta</CardTitle>
                        <CardDescription>
                            Contas com maior movimentação no período.
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        {movementChartData.length === 0 ? (
                            <EmptyChartState />
                        ) : (
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={movementChartData}
                                        barCategoryGap="35%"
                                    >
                                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="label"
                                            tickLine={false}
                                            axisLine={false}
                                            fontSize={12}
                                        />
                                        <YAxis
                                            tickLine={false}
                                            axisLine={false}
                                            fontSize={12}
                                            tickFormatter={(value) => formatCurrency(Number(value))}
                                        />
                                        <Tooltip content={<CurrencyTooltip />} />
                                        <Legend />
                                        <Bar
                                            dataKey="incomeAmount"
                                            name="Entradas"
                                            fill="hsl(var(--chart-1))"
                                            radius={[4, 4, 0, 0]}
                                            maxBarSize={24}
                                        />
                                        <Bar
                                            dataKey="expenseAmount"
                                            name="Saídas"
                                            fill="hsl(var(--chart-2))"
                                            radius={[4, 4, 0, 0]}
                                            maxBarSize={24}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Saldo atual por conta</CardTitle>
                        <CardDescription>
                            Ranking das contas com maior saldo atual calculado.
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        {balanceChartData.length === 0 ? (
                            <EmptyChartState />
                        ) : (
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={balanceChartData}
                                        layout="vertical"
                                        margin={{ left: 16 }}
                                        barCategoryGap="35%"
                                    >
                                        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                                        <XAxis
                                            type="number"
                                            tickLine={false}
                                            axisLine={false}
                                            fontSize={12}
                                            tickFormatter={(value) => formatCurrency(Number(value))}
                                        />
                                        <YAxis
                                            type="category"
                                            dataKey="label"
                                            tickLine={false}
                                            axisLine={false}
                                            fontSize={12}
                                            width={105}
                                        />
                                        <Tooltip content={<CurrencyTooltip />} />
                                        <ReferenceLine x={0} stroke="hsl(var(--border))" />
                                        <Bar
                                            dataKey="currentBalance"
                                            name="Saldo atual"
                                            fill="hsl(var(--chart-3))"
                                            radius={[0, 4, 4, 0]}
                                            maxBarSize={24}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </section>

            <Card>
                <CardHeader>
                    <CardTitle>Conferência por conta</CardTitle>
                    <CardDescription>
                        Detalhe dos saldos e movimentações reais por conta bancária, caixa
                        ou carteira digital.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {filteredAccounts.length === 0 ? (
                        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed">
                            <p className="text-sm text-muted-foreground">
                                Nenhuma conta encontrada para os filtros atuais.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-md border">
                            <div className="w-full overflow-x-auto">
                                <Table className="min-w-[1150px]">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Conta</TableHead>
                                            <TableHead>Tipo</TableHead>
                                            <TableHead className="text-right">Saldo inicial</TableHead>
                                            <TableHead className="text-right">Entradas</TableHead>
                                            <TableHead className="text-right">Saídas</TableHead>
                                            <TableHead className="text-right">Transferências</TableHead>
                                            <TableHead className="text-right">Resultado</TableHead>
                                            <TableHead className="text-right">Fim do período</TableHead>
                                            <TableHead className="text-right">Saldo atual</TableHead>
                                            <TableHead className="text-right">Mov.</TableHead>
                                            <TableHead className="text-right">Relatório</TableHead>
                                        </TableRow>
                                    </TableHeader>

                                    <TableBody>
                                        {filteredAccounts.map((item) => (
                                            <TableRow key={item.accountId}>
                                                <TableCell>
                                                    <div className="font-medium">{item.accountName}</div>

                                                    {item.bankName && (
                                                        <div className="text-xs text-muted-foreground">
                                                            {item.bankName}
                                                        </div>
                                                    )}
                                                </TableCell>

                                                <TableCell>
                                                    <Badge variant="secondary">
                                                        {accountTypeLabels[item.accountType]}
                                                    </Badge>
                                                </TableCell>

                                                <TableCell className="text-right">
                                                    {formatCurrency(item.openingBalance)}
                                                </TableCell>

                                                <TableCell className="text-right">
                                                    {formatCurrency(item.incomeAmount)}
                                                </TableCell>

                                                <TableCell className="text-right">
                                                    {formatCurrency(item.expenseAmount)}
                                                </TableCell>

                                                <TableCell className="text-right">
                                                    {formatCurrency(item.transferAmount)}
                                                </TableCell>

                                                <TableCell className="text-right">
                                                    <span
                                                        className={
                                                            item.netAmount < 0 ? "text-destructive" : undefined
                                                        }
                                                    >
                                                        {formatCurrency(item.netAmount)}
                                                    </span>
                                                </TableCell>

                                                <TableCell className="text-right font-medium">
                                                    <span
                                                        className={
                                                            item.closingBalance < 0
                                                                ? "text-destructive"
                                                                : undefined
                                                        }
                                                    >
                                                        {formatCurrency(item.closingBalance)}
                                                    </span>
                                                </TableCell>

                                                <TableCell className="text-right font-semibold">
                                                    <span
                                                        className={
                                                            item.currentBalance < 0 ? "text-destructive" : undefined
                                                        }
                                                    >
                                                        {formatCurrency(item.currentBalance)}
                                                    </span>
                                                </TableCell>

                                                <TableCell className="text-right">
                                                    {item.transactionCount}
                                                </TableCell>

                                                <TableCell className="text-right">
                                                    {item.accountType === "CREDIT_CARD" ? (
                                                        <span className="text-xs text-muted-foreground">
                                                            Use fatura
                                                        </span>
                                                    ) : (
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleExportAccountMovementPdf(item)}
                                                            disabled={
                                                                !hasValidPeriod ||
                                                                exportAccountMovementPdfMutation.isPending
                                                            }
                                                        >
                                                            <FileText className="mr-2 size-4" />

                                                            {exportAccountMovementPdfMutation.isPending
                                                                ? "Gerando..."
                                                                : "PDF"}
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}

                    <div className="mt-4 rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
                        Transferências são exibidas como movimentações neutras neste
                        relatório. O saldo calculado considera receitas e despesas
                        liquidadas, seguindo o modelo atual do sistema.
                    </div>
                </CardContent>
            </Card>
        </div >
    )
}

type HeroMiniMetricProps = {
    label: string
    value: number
    integer?: boolean
    highlight?: "positive" | "negative"
}

function HeroMiniMetric({
    label,
    value,
    integer,
    highlight,
}: HeroMiniMetricProps) {
    return (
        <div className="rounded-xl border bg-background/80 p-3 shadow-sm">
            <p className="text-xs text-muted-foreground">{label}</p>

            <p
                className={
                    highlight === "negative"
                        ? "mt-1 text-lg font-semibold text-destructive"
                        : "mt-1 text-lg font-semibold"
                }
            >
                {integer ? value : formatCurrency(value)}
            </p>
        </div>
    )
}

type MetricCardProps = {
    title: string
    value: number
    description: string
    icon: ComponentType<{ className?: string }>
    variant?: "positive" | "negative"
}

function MetricCard({
    title,
    value,
    description,
    icon: Icon,
    variant,
}: MetricCardProps) {
    return (
        <Card>
            <CardContent className="flex min-w-0 items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">{title}</p>

                    <p
                        className={
                            variant === "negative"
                                ? "break-words text-xl font-semibold leading-tight text-destructive 2xl:text-2xl"
                                : "break-words text-xl font-semibold leading-tight 2xl:text-2xl"
                        }
                    >
                        {formatCurrency(value)}
                    </p>

                    <p className="text-xs text-muted-foreground">{description}</p>
                </div>

                <div className="shrink-0 rounded-lg bg-muted p-2">
                    <Icon className="size-5 text-muted-foreground" />
                </div>
            </CardContent>
        </Card>
    )
}

type InsightRowProps = {
    label: string
    account?: AccountCashFlowItem
    value: number
    icon: ComponentType<{ className?: string }>
}

function InsightRow({
    label,
    account,
    value,
    icon: Icon,
}: InsightRowProps) {
    return (
        <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
            <div className="flex gap-3">
                <div className="rounded-lg bg-muted p-2">
                    <Icon className="size-4 text-muted-foreground" />
                </div>

                <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">
                        {account?.accountName ?? "Sem conta"}
                    </p>
                </div>
            </div>

            <p className="text-sm font-semibold">{formatCurrency(value)}</p>
        </div>
    )
}

function EmptyChartState() {
    return (
        <div className="flex h-72 items-center justify-center rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground">
                Sem dados suficientes para exibir gráfico neste período.
            </p>
        </div>
    )
}