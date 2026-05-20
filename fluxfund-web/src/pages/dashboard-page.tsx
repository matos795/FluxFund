import {
  AlertTriangle,
  Banknote,
  FolderTree,
  ReceiptText,
  TrendingDown,
  TrendingUp,
} from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { useDashboardSummary } from "@/features/dashboard/hooks/use-dashboard-summary"
import { formatCurrency } from "@/utils/formatters"
import { DashboardSummaryCard } from "@/features/dashboard/components/dashboard-summary-card"
import { DashboardPendingCard } from "@/features/dashboard/components/dashboard-pending-card"

const TEMP_ORGANIZATION_ID = "7b9ed617-92be-456d-81d6-dcde5841e7a0"

export function DashboardPage() {
  const today = new Date()

  const startDate = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .slice(0, 10)

  const endDate = today.toISOString().slice(0, 10)

  const {
    data: summary,
    isLoading,
    isError,
  } = useDashboardSummary({
    organizationId: TEMP_ORGANIZATION_ID,
    startDate,
    endDate,
  })

  if (isLoading) {
    return <p>Carregando dashboard...</p>
  }

  if (isError) {
    return <p>Não foi possível carregar o dashboard.</p>
  }

  const summaryCards = [
    {
      title: "Receitas do período",
      value: formatCurrency(summary?.incomeTotal ?? 0),
      description: `De ${summary?.startDate} até ${summary?.endDate}`,
      icon: TrendingUp,
    },
    {
      title: "Despesas do período",
      value: formatCurrency(summary?.expenseTotal ?? 0),
      description: `De ${summary?.startDate} até ${summary?.endDate}`,
      icon: TrendingDown,
    },
    {
      title: "Resultado do período",
      value: formatCurrency(summary?.netTotal ?? 0),
      description: "Receitas menos despesas",
      icon: ReceiptText,
    },
    {
      title: "Saldo em contas",
      value: formatCurrency(summary?.accountsTotalBalance ?? 0),
      description: "Saldo real estimado",
      icon: Banknote,
    },
    {
      title: "Saldo em fundos",
      value: formatCurrency(summary?.fundsTotalBalance ?? 0),
      description: "Saldo interno destinado",
      icon: FolderTree,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Visão geral da movimentação financeira."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {summaryCards.map((card) => (
          <DashboardSummaryCard
            key={card.title}
            title={card.title}
            value={card.value}
            description={card.description}
            icon={card.icon}
          />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <DashboardPendingCard
          title="Transações a classificar"
          value={summary?.unclassifiedCount ?? 0}
          description="Transações que ainda precisam de categoria."
          icon={AlertTriangle}
        />

        <DashboardPendingCard
          title="Transações a alocar"
          value={summary?.unallocatedCount ?? 0}
          description="Transações classificadas que ainda não foram totalmente destinadas."
          icon={AlertTriangle}
        />
      </div>
    </div>
  )
}