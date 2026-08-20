import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

import { Button } from "@/components/ui/button"

import {
    formatCurrency,
    formatDate,
} from "@/utils/formatters"
import type { FinancialRelationshipPartySummary } from "../financial-relationship-report-types"

type FinancialRelationshipRankingCardProps = {
    title: string
    description: string
    items: FinancialRelationshipPartySummary[]
    emptyMessage: string
    onViewParty?: (partyId: string) => void
}

export function FinancialRelationshipRankingCard({
    title,
    description,
    items,
    emptyMessage,
    onViewParty,
}: FinancialRelationshipRankingCardProps) {
    const topItems =
        items.slice(0, 8)

    return (
        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle>{title}</CardTitle>

                <p className="text-sm text-muted-foreground">
                    {description}
                </p>
            </CardHeader>

            <CardContent>
                {topItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        {emptyMessage}
                    </p>
                ) : (
                    <div className="space-y-4">
                        {topItems.map((item) => (
                            <div
                                key={item.partyId}
                                className="space-y-2 rounded-xl border p-3"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="truncate font-medium">
                                            {item.partyName}
                                        </p>

                                        <p className="text-xs text-muted-foreground">
                                            {item.activeMonthCount} de {""}
                                            meses ativos • última movimentação{" "}
                                            {item.lastSettlementDate
                                                ? formatDate(
                                                    item.lastSettlementDate,
                                                )
                                                : "—"}
                                        </p>
                                    </div>

                                    <div className="text-right">
                                        <p className="font-semibold">
                                            {formatCurrency(
                                                item.totalAmount,
                                            )}
                                        </p>

                                        <p className="text-xs text-muted-foreground">
                                            {item.sharePercentage.toFixed(
                                                2,
                                            )}
                                            %
                                        </p>
                                    </div>
                                </div>

                                <div className="h-2 overflow-hidden rounded-full bg-muted">
                                    <div
                                        className="h-full rounded-full bg-primary"
                                        style={{
                                            width: `${Math.min(
                                                item.sharePercentage,
                                                100,
                                            )}%`,
                                        }}
                                    />
                                </div>

                                {onViewParty && (
                                    <div className="flex justify-end">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                onViewParty(
                                                    item.partyId,
                                                )
                                            }
                                        >
                                            Ver contato
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}