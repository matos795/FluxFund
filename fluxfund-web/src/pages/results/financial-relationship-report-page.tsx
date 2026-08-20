import {
    ArrowUpCircle,
    ArrowDownCircle,
    Link2,
    PieChart,
} from "lucide-react"

import { useMemo } from "react"
import { useNavigate } from "react-router-dom"

import { DateRangePresetFilter } from "@/components/filters/date-range-preset-filter"
import { Skeleton } from "@/components/ui/skeleton"

import {
    formatCurrency,
} from "@/utils/formatters"

import { PageHeader } from "@/components/layout/page-header"
import { FinancialRelationshipSummaryCard } from "@/features/financial-relationships/components/financial-relationship-summary-card"
import { FinancialRelationshipEvolutionChart } from "@/features/financial-relationships/components/financial-relationship-evolution-chart"
import { FinancialRelationshipRankingCard } from "@/features/financial-relationships/components/financial-relationship-ranking-card"
import { FinancialRelationshipCommitmentCard } from "@/features/financial-relationships/components/financial-relationship-commitment-card"
import { useFinancialRelationshipReport } from "@/features/financial-relationships/hooks/use-financial-relationship-report"
import { getDateRangeForPreset } from "@/components/filters/date-range-presets"

export function FinancialRelationshipReportPage() {
    const navigate = useNavigate()

    const {
        value: period,
        setValue: setPeriod,
        startDate,
        endDate,
    } = getDateRangeForPreset("last-12-months")

    const reportQuery =
        useFinancialRelationshipReport({
            startDate,
            endDate,
        })

    const report =
        reportQuery.data

    const relationshipCoverageText =
        useMemo(() => {
            if (!report) {
                return "—"
            }

            return `${report.uniqueRelationshipCount} contatos com movimentação no período`
        }, [report])

    function handleViewParty(
        partyId: string,
    ) {
        navigate(
            `/financial-parties/${partyId}`,
        )
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Relacionamentos Financeiros"
                description="Entenda de quem vêm os recursos, para quem são destinados e como a carteira financeira da organização evolui."
            />

            <DateRangePresetFilter
                value={period}
                onChange={setPeriod}
                idPrefix="financial-relationships-period"
                label="Período"
                layout="compact"
                showSummary={false}
            />

            {reportQuery.isLoading ? (
                <div className="space-y-6">
                    <Skeleton className="h-28 w-full rounded-2xl" />
                    <Skeleton className="h-80 w-full rounded-2xl" />
                    <div className="grid gap-6 xl:grid-cols-2">
                        <Skeleton className="h-96 w-full rounded-2xl" />
                        <Skeleton className="h-96 w-full rounded-2xl" />
                    </div>
                    <Skeleton className="h-96 w-full rounded-2xl" />
                </div>
            ) : report ? (
                <>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <FinancialRelationshipSummaryCard
                            title="Recebido de contatos"
                            value={formatCurrency(
                                report.receivedFromPartiesTotal,
                            )}
                            description={`${report.incomeSourceCount} fontes de receita identificadas`}
                            icon={
                                <ArrowUpCircle className="size-5" />
                            }
                        />

                        <FinancialRelationshipSummaryCard
                            title="Pago a contatos"
                            value={formatCurrency(
                                report.paidToPartiesTotal,
                            )}
                            description={`${report.paymentRecipientCount} destinatários de pagamento`}
                            icon={
                                <ArrowDownCircle className="size-5" />
                            }
                        />

                        <FinancialRelationshipSummaryCard
                            title="Relacionamentos únicos"
                            value={String(
                                report.uniqueRelationshipCount,
                            )}
                            description={relationshipCoverageText}
                            icon={
                                <Link2 className="size-5" />
                            }
                        />

                        <FinancialRelationshipSummaryCard
                            title="Concentração Top 5"
                            value={`${report.topFiveIncomeConcentrationPercentage.toFixed(2)}%`}
                            description="Participação das 5 maiores fontes nas receitas relacionadas"
                            icon={
                                <PieChart className="size-5" />
                            }
                        />
                    </div>

                    <FinancialRelationshipEvolutionChart
                        months={report.months}
                    />

                    <div className="grid gap-6 xl:grid-cols-2">
                        <FinancialRelationshipRankingCard
                            title="Maiores fontes de receita"
                            description="Contatos que mais contribuíram com recursos no período."
                            items={
                                report.incomeSources
                            }
                            emptyMessage="Nenhuma fonte de receita identificada no período."
                            onViewParty={
                                handleViewParty
                            }
                        />

                        <FinancialRelationshipRankingCard
                            title="Maiores destinatários de pagamento"
                            description="Contatos para os quais a organização mais destinou recursos."
                            items={
                                report.paymentRecipients
                            }
                            emptyMessage="Nenhum destinatário de pagamento identificado no período."
                            onViewParty={
                                handleViewParty
                            }
                        />
                    </div>

                    <FinancialRelationshipCommitmentCard
                        commitmentReliability={
                            report.commitmentReliability
                        }
                    />
                </>
            ) : (
                <div className="rounded-2xl border border-dashed p-8 text-center">
                    <h2 className="text-lg font-semibold">
                        Nenhum dado encontrado
                    </h2>

                    <p className="mt-2 text-sm text-muted-foreground">
                        Ajuste o período e tente novamente.
                    </p>
                </div>
            )}
        </div>
    )
}