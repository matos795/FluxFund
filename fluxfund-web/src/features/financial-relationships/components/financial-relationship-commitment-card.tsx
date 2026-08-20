import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

import {
    formatCurrency,
} from "@/utils/formatters"
import type { FinancialRelationshipCommitmentReliability } from "../financial-relationship-report-types"

type FinancialRelationshipCommitmentCardProps = {
    commitmentReliability: FinancialRelationshipCommitmentReliability
}

export function FinancialRelationshipCommitmentCard({
    commitmentReliability,
}: FinancialRelationshipCommitmentCardProps) {
    const {
        expectedDueAmount,
        realizedAmount,
        coveredExpectedAmount,
        pendingAmount,
        exceededAmount,
        fulfillmentPercentage,
        dueOccurrenceCount,
        fulfilledOccurrenceCount,
        partialOccurrenceCount,
        pendingOccurrenceCount,
        exceededOccurrenceCount,
    } = commitmentReliability

    return (
        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle>
                    Confiabilidade dos compromissos
                </CardTitle>

                <p className="text-sm text-muted-foreground">
                    Mede quanto dos valores historicamente prometidos em compromissos a receber foi efetivamente coberto no período.
                </p>
            </CardHeader>

            <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-5">
                    <Metric
                        label="Previsto"
                        value={formatCurrency(
                            expectedDueAmount,
                        )}
                    />

                    <Metric
                        label="Realizado"
                        value={formatCurrency(
                            realizedAmount,
                        )}
                    />

                    <Metric
                        label="Coberto"
                        value={formatCurrency(
                            coveredExpectedAmount,
                        )}
                    />

                    <Metric
                        label="Pendente"
                        value={formatCurrency(
                            pendingAmount,
                        )}
                    />

                    <Metric
                        label="Excedente"
                        value={formatCurrency(
                            exceededAmount,
                        )}
                    />
                </div>

                <div className="rounded-2xl border bg-muted/20 p-4">
                    <div className="flex items-end justify-between gap-3">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Taxa de cumprimento
                            </p>

                            <p className="text-3xl font-semibold">
                                {fulfillmentPercentage.toFixed(
                                    2,
                                )}
                                %
                            </p>
                        </div>

                        <div className="text-right text-xs text-muted-foreground">
                            {dueOccurrenceCount} ocorrências avaliadas
                        </div>
                    </div>

                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-muted">
                        <div
                            className="h-full rounded-full bg-primary"
                            style={{
                                width: `${Math.min(
                                    fulfillmentPercentage,
                                    100,
                                )}%`,
                            }}
                        />
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                    <Metric
                        label="Cumpridos"
                        value={String(
                            fulfilledOccurrenceCount,
                        )}
                    />

                    <Metric
                        label="Parciais"
                        value={String(
                            partialOccurrenceCount,
                        )}
                    />

                    <Metric
                        label="Pendentes"
                        value={String(
                            pendingOccurrenceCount,
                        )}
                    />

                    <Metric
                        label="Excedidos"
                        value={String(
                            exceededOccurrenceCount,
                        )}
                    />
                </div>
            </CardContent>
        </Card>
    )
}

function Metric({
    label,
    value,
}: {
    label: string
    value: string
}) {
    return (
        <div className="rounded-xl border p-3">
            <p className="text-xs text-muted-foreground">
                {label}
            </p>

            <p className="mt-1 text-sm font-semibold">
                {value}
            </p>
        </div>
    )
}