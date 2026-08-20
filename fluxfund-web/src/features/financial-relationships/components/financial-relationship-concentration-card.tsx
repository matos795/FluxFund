import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

type FinancialRelationshipConcentrationCardProps = {
    incomePercentage: number
    paymentPercentage: number
}

export function FinancialRelationshipConcentrationCard({
    incomePercentage,
    paymentPercentage,
}: FinancialRelationshipConcentrationCardProps) {
    return (
        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle>
                    Concentração da carteira
                </CardTitle>

                <p className="text-sm text-muted-foreground">
                    Quanto das movimentações relacionadas está concentrado nos cinco maiores contatos.
                </p>
            </CardHeader>

            <CardContent className="space-y-6">
                <ConcentrationRow
                    label="5 maiores fontes"
                    value={incomePercentage}
                />

                <ConcentrationRow
                    label="5 maiores destinatários"
                    value={paymentPercentage}
                />

                <p className="text-xs leading-relaxed text-muted-foreground">
                    Quanto maior o percentual, maior a participação dos principais contatos na movimentação do período.
                </p>
            </CardContent>
        </Card>
    )
}

function ConcentrationRow({
    label,
    value,
}: {
    label: string
    value: number
}) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">
                    {label}
                </span>

                <span className="text-sm font-semibold">
                    {value.toFixed(2)}%
                </span>
            </div>

            <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                <div
                    className="h-full rounded-full bg-primary"
                    style={{
                        width: `${Math.min(
                            value,
                            100,
                        )}%`,
                    }}
                />
            </div>
        </div>
    )
}