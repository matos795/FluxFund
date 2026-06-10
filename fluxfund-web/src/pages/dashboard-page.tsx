import { useMemo, useState } from "react"
import {
  AlertTriangle,
  Banknote,
  CalendarDays,
  FolderTree,
  ListChecks,
  ReceiptText,
  TrendingDown,
  TrendingUp,
} from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { DashboardPeriodFilter } from "@/features/dashboard/components/dashboard-period-filter"
import { DashboardSummaryCard } from "@/features/dashboard/components/dashboard-summary-card"
import {
  dashboardPeriodLabels,
  getDashboardPeriod,
  type DashboardPeriodPreset,
} from "@/features/dashboard/dashboard-periods"
import { useDashboardSummary } from "@/features/dashboard/hooks/use-dashboard-summary"
import { formatCurrency, formatDate } from "@/utils/formatters"
import { useDashboardMonthlyCashFlow } from "@/features/dashboard/hooks/use-dashboard-monthly-cash-flow"
import { MonthlyCashFlowChart } from "@/features/dashboard/components/monthly-cash-flow-chart"
import { useDashboardExpensesByCategory } from "@/features/dashboard/hooks/use-dashboard-expenses-by-category"
import { ExpensesByCategoryChart } from "@/features/dashboard/components/expenses-by-category-chart"
import { useDashboardFundsOverview } from "@/features/dashboard/hooks/use-dashboard-funds-overview"
import { FundsOverviewChart } from "@/features/dashboard/components/funds-overview-chart"
import { useDashboardAlerts } from "@/features/dashboard/hooks/use-dashboard-alerts"
import { DashboardAlertsPanel } from "@/features/dashboard/components/dashboard-alerts-panel"
import { useDashboardActionItems } from "@/features/dashboard/hooks/use-dashboard-action-items"
import { DashboardActionItemsPanel } from "@/features/dashboard/components/dashboard-action-items-panel"

export function DashboardPage() {
  const [periodPreset, setPeriodPreset] =
    useState<DashboardPeriodPreset>("current-year")

  const period = useMemo(
    () => getDashboardPeriod(periodPreset),
    [periodPreset],
  )

  const {
    data: summary,
    isLoading,
    isError,
  } = useDashboardSummary({
    startDate: period.startDate,
    endDate: period.endDate,
  })

  const { data: monthlyCashFlow = [] } = useDashboardMonthlyCashFlow({
    startDate: period.startDate,
    endDate: period.endDate,
  })

  const { data: expensesByCategory = [] } = useDashboardExpensesByCategory({
    startDate: period.startDate,
    endDate: period.endDate,
    limit: 8,
  })

  const { data: fundsOverview = [] } = useDashboardFundsOverview({
    startDate: period.startDate,
    endDate: period.endDate,
    limit: 10,
  })

  const { data: alerts } = useDashboardAlerts({
    startDate: period.startDate,
    endDate: period.endDate,
  })

  const { data: actionItems } = useDashboardActionItems({
    startDate: period.startDate,
    endDate: period.endDate,
    limit: 5,
  })

  if (isLoading) {
    return <p>Carregando dashboard...</p>
  }

  if (isError) {
    return <p>Não foi possível carregar o dashboard.</p>
  }

  const netTotal = summary?.netTotal ?? 0

  const periodDescription = `De ${formatDate(summary?.startDate)} até ${formatDate(
    summary?.endDate,
  )}`

  const periodCards = [
    {
      title: "Receitas do período",
      value: formatCurrency(summary?.incomeTotal ?? 0),
      description: periodDescription,
      icon: TrendingUp,
      tone: "positive" as const,
    },
    {
      title: "Despesas do período",
      value: formatCurrency(summary?.expenseTotal ?? 0),
      description: periodDescription,
      icon: TrendingDown,
      tone: "negative" as const,
    },
    {
      title: "Resultado do período",
      value: formatCurrency(netTotal),
      description: netTotal >= 0 ? "Resultado positivo" : "Resultado negativo",
      icon: ReceiptText,
      tone: netTotal >= 0 ? ("positive" as const) : ("negative" as const),
    },
    {
      title: "Transações no período",
      value: String(summary?.transactionCount ?? 0),
      description: "Lançamentos baixados ou registrados no intervalo",
      icon: ListChecks,
      tone: "default" as const,
    },
  ]

  const snapshotCards = [
    {
      title: "Saldo em contas",
      value: formatCurrency(summary?.accountsTotalBalance ?? 0),
      description: "Fotografia atual do dinheiro real",
      icon: Banknote,
      tone: "default" as const,
    },
    {
      title: "Saldo em fundos",
      value: formatCurrency(summary?.fundsTotalBalance ?? 0),
      description: "Fotografia atual das destinações internas",
      icon: FolderTree,
      tone: "default" as const,
    },
    {
      title: "A classificar",
      value: String(summary?.unclassifiedCount ?? 0),
      description: "Transações sem categoria",
      icon: AlertTriangle,
      tone: (summary?.unclassifiedCount ?? 0) > 0 ? ("warning" as const) : ("default" as const),
    },
    {
      title: "A alocar",
      value: String(summary?.unallocatedCount ?? 0),
      description: "Transações ainda sem destinação completa",
      icon: AlertTriangle,
      tone: (summary?.unallocatedCount ?? 0) > 0 ? ("warning" as const) : ("default" as const),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <PageHeader
          title="Dashboard financeiro"
          description="Visão executiva da saúde financeira, saldos e pendências operacionais."
        />

        <DashboardPeriodFilter
          value={periodPreset}
          onChange={setPeriodPreset}
        />
      </div>

      <section className="rounded-xl border bg-card p-4">
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="size-4" />
          <span>
            Visão do período:{" "}
            <strong className="text-foreground">
              {dashboardPeriodLabels[periodPreset]}
            </strong>{" "}
            · {periodDescription}
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {periodCards.map((card) => (
            <DashboardSummaryCard
              key={card.title}
              title={card.title}
              value={card.value}
              description={card.description}
              icon={card.icon}
              tone={card.tone}
            />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Situação atual</h2>
          <p className="text-sm text-muted-foreground">
            Estes indicadores mostram o estado atual da operação, independente
            do período escolhido.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {snapshotCards.map((card) => (
            <DashboardSummaryCard
              key={card.title}
              title={card.title}
              value={card.value}
              description={card.description}
              icon={card.icon}
              tone={card.tone}
            />
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <MonthlyCashFlowChart data={monthlyCashFlow} />

        <div className="rounded-xl border bg-card p-4">
          <h3 className="font-semibold">Leitura rápida</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Compare as barras de receitas e despesas para entender o volume mensal.
            A linha mostra o resultado final de cada mês.
          </p>

          <div className="mt-4 space-y-3 text-sm">
            <div className="rounded-lg bg-muted p-3">
              <p className="font-medium">Receitas maiores que despesas</p>
              <p className="text-muted-foreground">
                O mês tende a gerar resultado positivo.
              </p>
            </div>

            <div className="rounded-lg bg-muted p-3">
              <p className="font-medium">Despesas maiores que receitas</p>
              <p className="text-muted-foreground">
                O mês tende a gerar resultado negativo.
              </p>
            </div>

            <div className="rounded-lg bg-muted p-3">
              <p className="font-medium">Resultado oscilando muito</p>
              <p className="text-muted-foreground">
                Pode indicar sazonalidade, repasses concentrados ou lançamentos fora
                do padrão.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <ExpensesByCategoryChart data={expensesByCategory} />
        <FundsOverviewChart data={fundsOverview} />
      </section>

      <section className="rounded-xl border bg-card p-4">
        <h3 className="font-semibold">Leitura financeira</h3>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-lg bg-muted p-3 text-sm">
            <p className="font-medium">Despesas por categoria</p>
            <p className="mt-1 text-muted-foreground">
              Mostra onde o dinheiro saiu no período selecionado.
            </p>
          </div>

          <div className="rounded-lg bg-muted p-3 text-sm">
            <p className="font-medium">Situação dos fundos</p>
            <p className="mt-1 text-muted-foreground">
              Mostra a fotografia atual das destinações internas.
            </p>
          </div>

          <div className="rounded-lg bg-muted p-3 text-sm">
            <p className="font-medium">Fundos negativos</p>
            <p className="mt-1 text-muted-foreground">
              Indicam projetos ou caixas que precisam de reposição, revisão ou
              conferência.
            </p>
          </div>
        </div>
      </section>

      <section>
        <DashboardAlertsPanel alerts={alerts} />
        <DashboardActionItemsPanel actionItems={actionItems} />
      </section>
    </div>
  )
}