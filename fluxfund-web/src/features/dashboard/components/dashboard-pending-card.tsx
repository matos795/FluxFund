import type { LucideIcon } from "lucide-react"

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Link } from "react-router-dom"

type DashboardPendingCardProps = {
    title: string
    value: number
    description: string
    icon: LucideIcon
    to?: string
}

export function DashboardPendingCard({
    title,
    value,
    description,
    icon: Icon,
    to
}: DashboardPendingCardProps) {
    const content = (
        <Card className={to ? "transition hover:bg-muted/50" : undefined}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="size-4 text-muted-foreground" />
            </CardHeader>

            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    )

    if (to) {
        return (
            <Link to={to}>
                {content}
            </Link>
        )
    }
    return content
}