import { Banknote, FolderTree, ReceiptText, Users } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const summaryCards = [
  {
    title: "Saldo em contas",
    value: "R$ 0,00",
    description: "Total em contas reais",
    icon: Banknote,
  },
  {
    title: "Fundos ativos",
    value: "0",
    description: "Destinações cadastradas",
    icon: FolderTree,
  },
  {
    title: "Transações",
    value: "0",
    description: "Lançamentos financeiros",
    icon: ReceiptText,
  },
  {
    title: "Favorecidos",
    value: "0",
    description: "Pessoas e entidades",
    icon: Users,
  },
]

export function DashboardPage() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Visão geral da movimentação financeira."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon

          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <Icon className="size-4 text-muted-foreground" />
              </CardHeader>

              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}