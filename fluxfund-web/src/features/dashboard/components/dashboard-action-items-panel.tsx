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

type DashboardActionItemsPanelProps = {
  actionItems?: DashboardActionItems
}

function getTransactionTitle(item: DashboardTransactionActionItem) {
  return item.description || item.rawDescription || "Transação sem descrição"
}

function TransactionActionItem({
  item,
}: {
  item: DashboardTransactionActionItem
}) {
  return (
    <Link
      to={`/transactions?description=${encodeURIComponent(
        getTransactionTitle(item),
      )}`}
      className="block rounded-lg border p-3 transition hover:bg-muted/50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {getTransactionTitle(item)}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
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
      className="block rounded-lg border p-3 transition hover:bg-muted/50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{item.fundName}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Fundo com saldo interno negativo
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
}: DashboardActionItemsPanelProps) {
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
        />
      </div>
    </section>
  )
}