import {
    AlertTriangle,
    FileWarning,
    FolderKanban,
    ListTodo,
    Tags,
} from "lucide-react"
import { Link } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { DashboardCardSkeleton } from "./dashboard-card-skeleton"
import { DashboardActionListCard } from "./dashboard-action-list-card"
import { formatCurrency, formatDate } from "@/utils/formatters"
import type {
    DashboardActionItems,
    DashboardFundActionItem,
    DashboardTransactionActionItem,
} from "../dashboard-types"

type DashboardActionItemsPanelProps = {
    actionItems?: DashboardActionItems
    isLoading?: boolean
}

function getTransactionTitle(item: DashboardTransactionActionItem) {
    return item.description || item.rawDescription || "Transação sem descrição"
}

function getDaysSince(date: string | null) {
    if (!date) {
        return null
    }

    const transactionDate = new Date(`${date}T00:00:00`)
    const today = new Date()

    transactionDate.setHours(0, 0, 0, 0)
    today.setHours(0, 0, 0, 0)

    const diffInMs = today.getTime() - transactionDate.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    return diffInDays >= 0 ? diffInDays : 0
}

function getTransactionBadges(item: DashboardTransactionActionItem) {
    const badges: {
        label: string
        className: string
    }[] = []

    const daysSince = getDaysSince(item.settlementDate)

    if (item.amount >= 1000) {
        badges.push({
            label: "Alto valor",
            className: "bg-amber-100 text-amber-800 hover:bg-amber-100",
        })
    }

    if (daysSince !== null && daysSince > 30) {
        badges.push({
            label: "Antiga",
            className: "bg-red-100 text-red-800 hover:bg-red-100",
        })
    }

    return badges
}

function TransactionActionItem({
    item,
    action,
    variant = "default",
}: {
    item: DashboardTransactionActionItem
    action: "classify" | "allocate" | "attachments" | "view"
    variant?: "default" | "warning" | "danger"
}) {
    const title = getTransactionTitle(item)
    const badges = getTransactionBadges(item)
    const isCritical = badges.some((badge) => badge.label === "Antiga")
    const isHighValue = badges.some((badge) => badge.label === "Alto valor")

    const borderClass =
        variant === "danger" || isCritical
            ? "border-l-red-500"
            : variant === "warning" || isHighValue
                ? "border-l-amber-500"
                : "border-l-transparent"

    return (
        <Link
            to={`/transactions?transactionId=${item.transactionId}&action=${action}`}
            className={`block border-l-4 px-3 py-2.5 transition hover:bg-muted/50 ${borderClass}`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                        {(variant === "danger" || isCritical) && (
                            <AlertTriangle className="size-3.5 shrink-0 text-red-600" />
                        )}

                        <p className="truncate text-sm font-medium">{title}</p>
                    </div>

                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {item.settlementDate ? formatDate(item.settlementDate) : "Sem data"}{" "}
                        · {item.accountName}
                        {item.categoryName ? ` · ${item.categoryName}` : ""}
                    </p>

                    {badges.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                            {badges.map((badge) => (
                                <Badge
                                    key={badge.label}
                                    className={`h-5 px-1.5 text-[10px] ${badge.className}`}
                                >
                                    {badge.label}
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>

                <span
                    className={`shrink-0 text-sm font-semibold ${variant === "danger" || isHighValue ? "text-foreground" : ""
                        }`}
                >
                    {formatCurrency(item.amount)}
                </span>
            </div>
        </Link>
    )
}

function FundActionItem({ item }: { item: DashboardFundActionItem }) {
    const isCritical = item.currentBalance <= -1000

    return (
        <Link
            to="/reports/funds"
            className={`block border-l-4 px-3 py-2.5 transition hover:bg-muted/50 ${isCritical ? "border-l-red-500" : "border-l-amber-500"
                }`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                        <AlertTriangle
                            className={`size-3.5 shrink-0 ${isCritical ? "text-red-600" : "text-amber-600"
                                }`}
                        />

                        <p className="truncate text-sm font-medium">{item.fundName}</p>
                    </div>

                    <p className="mt-0.5 text-xs text-muted-foreground">
                        Saldo interno negativo
                    </p>

                    <div className="mt-2">
                        <Badge
                            className={
                                isCritical
                                    ? "h-5 bg-red-100 px-1.5 text-[10px] text-red-800 hover:bg-red-100"
                                    : "h-5 bg-amber-100 px-1.5 text-[10px] text-amber-800 hover:bg-amber-100"
                            }
                        >
                            {isCritical ? "Crítico" : "Atenção"}
                        </Badge>
                    </div>
                </div>

                <span className="shrink-0 text-sm font-semibold text-red-600">
                    {formatCurrency(item.currentBalance)}
                </span>
            </div>
        </Link>
    )
}

export function DashboardActionItemsPanel({
    actionItems,
    isLoading = false,
}: DashboardActionItemsPanelProps) {
    if (isLoading) {
        return (
            <section className="space-y-4">
                <div>
                    <div className="h-6 w-48 animate-pulse rounded-md bg-muted" />
                    <div className="mt-2 h-4 w-80 max-w-full animate-pulse rounded-md bg-muted" />
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                    <DashboardCardSkeleton height="h-44" />
                    <DashboardCardSkeleton height="h-44" />
                    <DashboardCardSkeleton height="h-44" />
                    <DashboardCardSkeleton height="h-44" />
                </div>
            </section>
        )
    }

    const unclassifiedTransactions =
        actionItems?.unclassifiedTransactions ?? []

    const unallocatedTransactions = actionItems?.unallocatedTransactions ?? []

    const expensesWithoutFiscalDocument =
        actionItems?.expensesWithoutFiscalDocument ?? []

    const negativeFunds = actionItems?.negativeFunds ?? []

    return (
        <section className="space-y-4">
            <div>
                <h2 className="text-lg font-semibold">Pendências acionáveis</h2>
                <p className="text-sm text-muted-foreground">
                    Listas curtas para revisar rapidamente o que precisa de ação.
                </p>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
                <DashboardActionListCard
                    title="A classificar"
                    description="Transações que ainda precisam de categoria."
                    icon={Tags}
                    items={unclassifiedTransactions}
                    emptyMessage="Nenhuma transação pendente de classificação."
                    viewAllTo="/transactions?onlyUnclassified=true"
                    getItemKey={(item) => item.transactionId}
                    renderItem={(item) => (
                        <TransactionActionItem
                            item={item}
                            action="classify"
                            variant="warning"
                        />
                    )}
                    compact
                />

                <DashboardActionListCard
                    title="A alocar"
                    description="Transações liquidadas sem destinação completa."
                    icon={ListTodo}
                    items={unallocatedTransactions}
                    emptyMessage="Nenhuma transação pendente de alocação."
                    viewAllTo="/transactions?onlyUnallocated=true&status=SETTLED"
                    getItemKey={(item) => item.transactionId}
                    renderItem={(item) => (
                        <TransactionActionItem
                            item={item}
                            action="allocate"
                            variant="warning"
                        />
                    )}
                    compact
                />

                <DashboardActionListCard
                    title="Sem documento fiscal"
                    description="Despesas baixadas sem nota, recibo ou contrato."
                    icon={FileWarning}
                    items={expensesWithoutFiscalDocument}
                    emptyMessage="Nenhuma despesa sem documento fiscal no período."
                    viewAllTo="/transactions?type=EXPENSE&status=SETTLED"
                    getItemKey={(item) => item.transactionId}
                    renderItem={(item) => (
                        <TransactionActionItem
                            item={item}
                            action="attachments"
                            variant="danger"
                        />
                    )}
                    compact
                />

                <DashboardActionListCard
                    title="Fundos negativos"
                    description="Fundos ou projetos com saldo interno abaixo de zero."
                    icon={FolderKanban}
                    items={negativeFunds}
                    emptyMessage="Nenhum fundo negativo encontrado."
                    viewAllTo="/reports/funds"
                    getItemKey={(item) => item.fundId}
                    renderItem={(item) => <FundActionItem item={item} />}
                    compact
                />
            </div>
        </section>
    )
}