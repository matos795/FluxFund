import {
    ArrowUpCircle,
    ArrowDownCircle,
    Link2,
    ClipboardCheck,
    TrendingUp,
} from "lucide-react"

import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

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
import { getDateRangeForPreset, type DateRangeValue } from "@/components/filters/date-range-presets"
import { FinancialRelationshipConcentrationCard } from "@/features/financial-relationships/components/financial-relationship-concentration-card"
import { Button } from "@/components/ui/button"

export function FinancialRelationshipReportPage() {
    const navigate = useNavigate()

    const [period, setPeriod] =
        useState<DateRangeValue>(() =>
            getDateRangeForPreset(
                "last-12-months",
            ),
        )

    const {
        startDate,
        endDate,
    } = period

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
            >
                <Button
                    asChild
                    variant="outline"
                >
                    <Link to="/reports/financial-forecast">
                        <TrendingUp className="mr-2 size-4" />
                        Ver previsão financeira
                    </Link>
                </Button>
            </PageHeader>

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
                            title="Cumprimento dos compromissos"
                            value={`${report.commitmentReliability.fulfillmentPercentage.toFixed(2)}%`}
                            description={`${report.commitmentReliability.dueOccurrenceCount} ocorrências históricas avaliadas`}
                            icon={
                                <ClipboardCheck className="size-5" />
                            }
                        />
                    </div>

                    <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
                        <FinancialRelationshipEvolutionChart
                            months={report.months}
                        />

                        <FinancialRelationshipConcentrationCard
                            incomePercentage={
                                report.topFiveIncomeConcentrationPercentage
                            }
                            paymentPercentage={
                                report.topFivePaymentConcentrationPercentage
                            }
                        />
                    </div>

                    <div className="grid gap-6 xl:grid-cols-2">
                        <FinancialRelationshipRankingCard
                            title="Maiores fontes de receita"
                            description="Contatos que mais contribuíram com recursos no período."
                            items={
                                report.incomeSources
                            }
                            emptyMessage="Nenhuma fonte de receita identificada no período."
                            monthCount={report.monthCount}
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
                            monthCount={report.monthCount}
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