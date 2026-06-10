import {
    FileWarning,
    FolderKanban,
    ListTodo,
    Tags,
} from "lucide-react"
import { Link } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import type { DashboardAlerts } from "../dashboard-types"
import { DashboardCardSkeleton } from "./dashboard-card-skeleton"

type DashboardAlertsPanelProps = {
    alerts?: DashboardAlerts
    isLoading?: boolean
}

type AlertItem = {
    title: string
    description: string
    value: number
    icon: React.ElementType
    to?: string
    variant: "warning" | "danger" | "neutral"
}

const variantClasses = {
    warning: "border-amber-200 bg-amber-50 text-amber-950",
    danger: "border-red-200 bg-red-50 text-red-950",
    neutral: "border-border bg-muted/40 text-foreground",
}

const badgeClasses = {
    warning: "bg-amber-100 text-amber-800 hover:bg-amber-100",
    danger: "bg-red-100 text-red-800 hover:bg-red-100",
    neutral: "bg-background text-foreground hover:bg-background",
}

export function DashboardAlertsPanel({ alerts, isLoading = false }: DashboardAlertsPanelProps) {

    if (isLoading) {
        return <DashboardCardSkeleton height="h-28" />
    }

    const items: AlertItem[] = [
        {
            title: "A classificar",
            description: "Transações sem categoria definida.",
            value: alerts?.unclassifiedCount ?? 0,
            icon: Tags,
            to: "/transactions?onlyUnclassified=true",
            variant: "warning",
        },
        {
            title: "A alocar",
            description: "Transações liquidadas sem destinação completa.",
            value: alerts?.unallocatedCount ?? 0,
            icon: ListTodo,
            to: "/transactions?onlyUnallocated=true&status=SETTLED",
            variant: "warning",
        },
        {
            title: "Fundos negativos",
            description: "Fundos ou projetos com saldo interno abaixo de zero.",
            value: alerts?.negativeFundsCount ?? 0,
            icon: FolderKanban,
            to: "/reports/funds",
            variant: "danger",
        },
        {
            title: "Sem documento fiscal",
            description: "Despesas baixadas sem nota, recibo ou contrato.",
            value: alerts?.expensesWithoutFiscalDocumentCount ?? 0,
            icon: FileWarning,
            to: "/transactions?type=EXPENSE&status=SETTLED",
            variant: "danger",
        },
    ]

    const totalAlerts = items.reduce((total, item) => total + item.value, 0)

    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <CardTitle>Alertas operacionais</CardTitle>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Alguns alertas consideram o período selecionado; outros mostram a situação
                            atual da operação.
                        </p>
                    </div>

                    <Badge variant="outline">
                        {totalAlerts} {totalAlerts === 1 ? "alerta" : "alertas"}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent>
                {totalAlerts === 0 ? (
                    <div className="rounded-lg border border-dashed p-6 text-center">
                        <p className="font-medium">Nenhuma pendência crítica encontrada</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            As principais rotinas financeiras parecem estar em dia.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        {items.map((item) => {
                            const Icon = item.icon
                            const content = (
                                <div
                                    className={`h-full rounded-lg border p-4 transition ${item.value > 0
                                            ? variantClasses[item.variant]
                                            : variantClasses.neutral
                                        } ${item.to ? "hover:brightness-95" : ""}`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="rounded-full bg-background/70 p-2">
                                            <Icon className="size-4" />
                                        </div>

                                        <Badge
                                            className={
                                                item.value > 0
                                                    ? badgeClasses[item.variant]
                                                    : badgeClasses.neutral
                                            }
                                        >
                                            {item.value}
                                        </Badge>
                                    </div>

                                    <div className="mt-4">
                                        <p className="font-medium">{item.title}</p>
                                        <p className="mt-1 text-sm opacity-80">
                                            {item.description}
                                        </p>
                                    </div>
                                </div>
                            )

                            if (!item.to) {
                                return <div key={item.title}>{content}</div>
                            }

                            return (
                                <Link key={item.title} to={item.to}>
                                    {content}
                                </Link>
                            )
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}