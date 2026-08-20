import type { ReactNode } from "react"

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

type FinancialRelationshipSummaryCardProps = {
    title: string
    value: string
    description: string
    icon: ReactNode
}

export function FinancialRelationshipSummaryCard({
    title,
    value,
    description,
    icon,
}: FinancialRelationshipSummaryCardProps) {
    return (
        <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                <div className="space-y-1">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        {title}
                    </CardTitle>

                    <p className="text-2xl font-semibold tracking-tight">
                        {value}
                    </p>
                </div>

                <div className="rounded-xl border bg-muted/30 p-2">
                    {icon}
                </div>
            </CardHeader>

            <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground">
                    {description}
                </p>
            </CardContent>
        </Card>
    )
}