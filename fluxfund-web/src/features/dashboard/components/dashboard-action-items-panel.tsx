import {
    FileWarning,
    FolderKanban,
    ListTodo,
    Tags,
} from "lucide-react"
import { Link } from "react-router-dom"

import { DashboardActionListCard } from "./dashboard-action-list-card"
import { formatCurrency, formatDate } from "@/utils/formatters"
import type {
    DashboardActionItems,
    DashboardFundActionItem,
    DashboardTransactionActionItem,
} from "../dashboard-types"
import { DashboardCardSkeleton } from "./dashboard-card-skeleton"

type DashboardActionItemsPanelProps = {
    actionItems?: DashboardActionItems
    isLoading?: boolean
}

function getTransactionTitle(item: DashboardTransactionActionItem) {
    return item.description || item.rawDescription || "Transação sem descrição"
}

function TransactionActionItem({
    item,
}: {
    item: DashboardTransactionActionItem
}) {
    const title = getTransactionTitle(item)

    return (
        <Link
            to={`/transactions?description=${encodeURIComponent(title)}`}
            className="block px-3 py-2.5 transition hover:bg-muted/50"
        >
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{title}</p>

                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {item.settlementDate ? formatDate(item.settlementDate) : "Sem data"}{" "}
                        · {item.accountName}
                        {item.categoryName ? ` · ${item.categoryName}` : ""}
                    </p>
                </div>

                <span className="shrink-0 text-sm font-semibold">
                    {formatCurrency(item.amount)}
                </span>
            </div>
        </Link>
    )
}

function FundActionItem({ item }: { item: DashboardFundActionItem }) {
    return (
        <Link
            to="/reports/funds"
            className="block px-3 py-2.5 transition hover:bg-muted/50"
        >
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.fundName}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        Saldo interno negativo
                    </p>
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
    isLoading = false
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
                    renderItem={(item) => <TransactionActionItem item={item} />}
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
                    renderItem={(item) => <TransactionActionItem item={item} />}
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
                    renderItem={(item) => <TransactionActionItem item={item} />}
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