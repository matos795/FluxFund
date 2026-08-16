import { useState, type ReactNode } from "react"
import {
  Activity,
  AlertTriangle,
  Banknote,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  FolderTree,
  ListChecks,
  ReceiptText,
  TrendingDown,
  TrendingUp,
} from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DashboardActionItemsPanel } from "@/features/dashboard/components/dashboard-action-items-panel"
import { DashboardAlertsPanel } from "@/features/dashboard/components/dashboard-alerts-panel"
import { DashboardSummaryCard } from "@/features/dashboard/components/dashboard-summary-card"
import { ExpensesByCategoryChart } from "@/features/dashboard/components/expenses-by-category-chart"
import { FundsOverviewChart } from "@/features/dashboard/components/funds-overview-chart"
import { MonthlyCashFlowChart } from "@/features/dashboard/components/monthly-cash-flow-chart"
import { useDashboardActionItems } from "@/features/dashboard/hooks/use-dashboard-action-items"
import { useDashboardAlerts } from "@/features/dashboard/hooks/use-dashboard-alerts"
import { useDashboardExpensesByCategory } from "@/features/dashboard/hooks/use-dashboard-expenses-by-category"
import { useDashboardFundsOverview } from "@/features/dashboard/hooks/use-dashboard-funds-overview"
import { useDashboardMonthlyCashFlow } from "@/features/dashboard/hooks/use-dashboard-monthly-cash-flow"
import { useDashboardSummary } from "@/features/dashboard/hooks/use-dashboard-summary"
import { formatCurrency, formatDate } from "@/utils/formatters"
import { dateRangePresetLabels, getDateRangeForPreset, type DateRangePreset, type DateRangeValue } from "@/components/filters/date-range-presets"
import { DateRangePresetFilter } from "@/components/filters/date-range-preset-filter"

const DASHBOARD_PERIOD_OPTIONS: Exclude<DateRangePreset, "all">[] = [
  "current-month",
  "previous-month",
  "specific-day",
  "specific-month",
  "current-quarter",
  "previous-quarter",
  "current-year",
  "previous-year",
  "last-12-months",
  "custom",
]

function DashboardSectionHeader({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {action}
    </div>
  )
}

function DashboardPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="h-8 w-64 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-96 max-w-full animate-pulse rounded-md bg-muted" />
        </div>

        <div className="h-10 w-44 animate-pulse rounded-md bg-muted" />
      </div>

      <div className="h-28 animate-pulse rounded-xl bg-muted" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-xl bg-muted"
          />
        ))}
      </div>

      <div className="h-72 animate-pulse rounded-xl bg-muted" />
    </div>
  )
}

function DashboardErrorState() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CircleAlert className="size-5 text-destructive" />
          Não foi possível carregar o dashboard
        </CardTitle>
      </CardHeader>

      <CardContent>
        <p className="text-sm text-muted-foreground">
          Verifique sua conexão, a organização ativa ou tente atualizar a página.
        </p>
      </CardContent>
    </Card>
  )
}

function getFinancialHealthMessage({
  netTotal,
  totalAlerts,
}: {
  netTotal: number
  totalAlerts: number
}) {
  if (totalAlerts === 0 && netTotal >= 0) {
    return {
      title: "Operação em boa condição",
      description:
        "O período está positivo e não há alertas operacionais críticos.",
      icon: CheckCircle2,
      className: "border-emerald-200 bg-emerald-50 text-emerald-950",
    }
  }

  if (netTotal < 0 || totalAlerts > 0) {
    return {
      title: "Atenção necessária",
      description:
        "Existem pontos que precisam de revisão na operação financeira.",
      icon: AlertTriangle,
      className: "border-amber-200 bg-amber-50 text-amber-950",
    }
  }

  return {
    title: "Dashboard atualizado",
    description: "Acompanhe os indicadores e pendências da organização.",
    icon: Activity,
    className: "border-border bg-card text-foreground",
  }
}

export function DashboardPage() {

  const [period, setPeriod] = useState<DateRangeValue>(() =>
    getDateRangeForPreset("current-year"),
  )

  const {
    data: summary,
    isLoading,
    isError,
  } = useDashboardSummary({
    startDate: period.startDate,
    endDate: period.endDate,
  })

  const {
    data: monthlyCashFlow = [],
    isLoading: isMonthlyCashFlowLoading,
  } = useDashboardMonthlyCashFlow({
    startDate: period.startDate,
    endDate: period.endDate,
  })

  const {
    data: expensesByCategory = [],
    isLoading: isExpensesByCategoryLoading,
  } = useDashboardExpensesByCategory({
    startDate: period.startDate,
    endDate: period.endDate,
    limit: 8,
  })

  const {
    data: fundsOverview = [],
    isLoading: isFundsOverviewLoading,
  } = useDashboardFundsOverview({
    startDate: period.startDate,
    endDate: period.endDate,
    limit: 10,
  })

  const { data: alerts, isLoading: isAlertsLoading } = useDashboardAlerts({
    startDate: period.startDate,
    endDate: period.endDate,
  })

  const {
    data: actionItems,
    isLoading: isActionItemsLoading,
  } = useDashboardActionItems({
    startDate: period.startDate,
    endDate: period.endDate,
    limit: 5,
  })

  if (isLoading) {
    return <DashboardPageSkeleton />
  }

  if (isError || !summary) {
    return <DashboardErrorState />
  }

  const netTotal = summary.netTotal ?? 0

  const totalOperationalAlerts =
    (alerts?.unclassifiedCount ?? 0) +
    (alerts?.unallocatedCount ?? 0) +
    (alerts?.negativeFundsCount ?? 0) +
    (alerts?.expensesWithoutFiscalDocumentCount ?? 0)

  const health = getFinancialHealthMessage({
    netTotal,
    totalAlerts: totalOperationalAlerts,
  })

  const HealthIcon = health.icon

  const periodDescription = `De ${formatDate(summary.startDate)} até ${formatDate(
    summary.endDate,
  )}`

  const periodCards = [
    {
      title: "Entradas em contas",
      value:
        formatCurrency(
          summary.incomeTotal ?? 0,
        ),
      description:
        periodDescription,
      icon: TrendingUp,
      tone: "positive" as const,
    },
    {
      title: "Saídas de contas",
      value:
        formatCurrency(
          summary.expenseTotal ?? 0,
        ),
      description:
        "Pagamentos efetivos no período",
      icon: TrendingDown,
      tone: "negative" as const,
    },
    {
      title: "Variação de caixa",
      value:
        formatCurrency(netTotal),
      description:
        netTotal >= 0
          ? "O caixa aumentou no período"
          : "O caixa diminuiu no período",
      icon: ReceiptText,
      tone:
        netTotal >= 0
          ? ("positive" as const)
          : ("negative" as const),
    },
    {
      title: "Lançamentos no período",
      value: String(summary.transactionCount ?? 0),
      description: "Lançamentos registrados no intervalo",
      icon: ListChecks,
      tone: "default" as const,
    },
  ]

  const snapshotCards = [
    {
      title: "Saldo em contas",
      value: formatCurrency(summary.accountsTotalBalance ?? 0),
      description: "Fotografia atual do dinheiro real",
      icon: Banknote,
      tone: "default" as const,
    },
    {
      title: "Saldo em fundos",
      value: formatCurrency(summary.fundsTotalBalance ?? 0),
      description: "Fotografia atual das destinações internas",
      icon: FolderTree,
      tone: "default" as const,
    },
    {
      title: "A classificar",
      value: String(summary.unclassifiedCount ?? 0),
      description: "Transações sem categoria",
      icon: AlertTriangle,
      tone:
        (summary.unclassifiedCount ?? 0) > 0
          ? ("warning" as const)
          : ("default" as const),
    },
    {
      title: "A alocar",
      value: String(summary.unallocatedCount ?? 0),
      description: "Transações sem destinação completa",
      icon: AlertTriangle,
      tone:
        (summary.unallocatedCount ?? 0) > 0
          ? ("warning" as const)
          : ("default" as const),
    },
  ]

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <PageHeader
          title="Dashboard financeiro"
          description="Painel de comando para acompanhar resultado, saldos, pendências e saúde dos fundos."
        />

        <div className="rounded-xl border bg-card p-4">
          <DateRangePresetFilter
            value={period}
            onChange={setPeriod}
            idPrefix="dashboard-period"
            label="Período analisado"
            presetOptions={DASHBOARD_PERIOD_OPTIONS}
            layout="full"
            className="w-full"
          />
        </div>
      </div>

      <section
        className={`rounded-2xl border p-5 shadow-sm ${health.className}`}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-background/70">
              <HealthIcon className="size-5" />
            </div>

            <div>
              <p className="text-sm font-medium opacity-80">
                Saúde financeira
              </p>
              <h2 className="text-xl font-semibold tracking-tight">
                {health.title}
              </h2>
              <p className="mt-1 text-sm opacity-80">{health.description}</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[520px]">
            <div className="rounded-xl bg-background/70 p-3">
              <p className="text-xs opacity-70">Período</p>
              <p className="mt-1 font-medium">
                {dateRangePresetLabels[period.preset]}
              </p>
            </div>

            <div className="rounded-xl bg-background/70 p-3">
              <p className="text-xs opacity-70">Resultado</p>
              <p className="mt-1 font-medium">{formatCurrency(netTotal)}</p>
            </div>

            <div className="rounded-xl bg-background/70 p-3">
              <p className="text-xs opacity-70">Alertas</p>
              <p className="mt-1 font-medium">
                {totalOperationalAlerts}{" "}
                {totalOperationalAlerts === 1 ? "pendência" : "pendências"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <DashboardSectionHeader
          title="Resumo do período"
          description="Indicadores calculados com base no intervalo selecionado."
          action={
            <div className="flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground">
              <CalendarDays className="size-3.5" />
              <span>{periodDescription}</span>
            </div>
          }
        />

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
        <DashboardSectionHeader
          title="Situação atual"
          description="Fotografia operacional da organização neste momento."
        />

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

      <section>
        <DashboardAlertsPanel alerts={alerts} isLoading={isAlertsLoading} />
      </section>

      <DashboardActionItemsPanel
        actionItems={actionItems}
        isLoading={isActionItemsLoading}
      />

      <section className="space-y-4">
        <DashboardSectionHeader
          title="Análise financeira"
          description="Gráficos para entender evolução, concentração de despesas e saúde dos fundos."
        />

        <div className="grid gap-4 xl:grid-cols-3">
          <MonthlyCashFlowChart
            data={monthlyCashFlow}
            isLoading={isMonthlyCashFlowLoading}
          />

          <Card>
            <CardHeader>
              <CardTitle>Como ler este painel</CardTitle>
              <p className="text-sm text-muted-foreground">
                Use os gráficos para investigar comportamento financeiro, não
                apenas para conferir totais.
              </p>
            </CardHeader>

            <CardContent className="space-y-3 text-sm">
              <div className="rounded-lg bg-muted p-3">
                <p className="font-medium">Resultado mensal</p>
                <p className="text-muted-foreground">
                  Mostra se o período está ficando mais positivo ou mais
                  pressionado.
                </p>
              </div>

              <div className="rounded-lg bg-muted p-3">
                <p className="font-medium">Despesas concentradas</p>
                <p className="text-muted-foreground">
                  Categorias muito altas podem indicar revisão de gastos ou erro
                  de classificação.
                </p>
              </div>

              <div className="rounded-lg bg-muted p-3">
                <p className="font-medium">Fundos negativos</p>
                <p className="text-muted-foreground">
                  Fundos abaixo de zero pedem conferência de alocação, repasse
                  ou recomposição.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <ExpensesByCategoryChart
            data={expensesByCategory}
            isLoading={isExpensesByCategoryLoading}
          />
          <FundsOverviewChart
            data={fundsOverview}
            isLoading={isFundsOverviewLoading}
          />
        </div>
      </section>
    </div>
  )
}