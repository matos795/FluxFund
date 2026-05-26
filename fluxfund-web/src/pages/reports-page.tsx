import { PageHeader } from "@/components/layout/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ArrowRight, BarChart3, Clock, FolderTree, HandCoins, Landmark } from "lucide-react"
import { Link } from "react-router-dom"

const reports = [
  {
    title: "Resultado por Categoria",
    description:
      "Analise receitas, despesas e resultado agrupados pelo plano de contas.",
    icon: BarChart3,
    status: "available",
    to: "/reports/category-result",
  },
  {
    title: "Fundos e Projetos",
    description:
      "Acompanhe saldo atual, entradas e saídas por fundo ou projeto.",
    icon: FolderTree,
    status: "available",
    to: "/reports/funds",
  },
  {
    title: "Fluxo de Caixa",
    description:
      "Veja entradas e saídas por conta real, banco ou caixa físico.",
    icon: Landmark,
    status: "soon",
    to: null,
  },
  {
    title: "Pendências Financeiras",
    description:
      "Liste transações a classificar, a alocar ou ainda não baixadas.",
    icon: Clock,
    status: "soon",
    to: null,
  },
  {
    title: "Prestação de Contas / Sustento",
    description:
      "Acompanhe valores destinados, repassados e saldos a repassar por favorecido.",
    icon: HandCoins,
    status: "available",
    to: "/reports/accountability",
  }
]

export function ReportsPage() {
  const featuredReport = reports[0]
  const FeaturedIcon = featuredReport.icon

  return (
    <div className="space-y-8">
      <PageHeader
        title="Relatórios"
        description="Acompanhe resultados financeiros, fundos, projetos e pendências."
      />

      <section className="rounded-2xl border bg-muted/30 p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <Badge variant="secondary">Relatório recomendado</Badge>

            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-background p-3 shadow-sm">
                <FeaturedIcon className="size-7 text-muted-foreground" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-semibold">
                  {featuredReport.title}
                </h2>

                <p className="max-w-2xl text-sm text-muted-foreground">
                  {featuredReport.description}
                </p>
              </div>
            </div>
          </div>

          <Button asChild>
            <Link to={featuredReport.to ?? "#"}>
              Abrir relatório
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Biblioteca de relatórios</h2>
          <p className="text-sm text-muted-foreground">
            Escolha o tipo de análise que deseja visualizar.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {reports.map((report) => {
            const Icon = report.icon
            const isAvailable = report.status === "available"

            return (
              <Card
                key={report.title}
                className="group flex flex-col justify-between transition hover:shadow-md"
              >
                <CardHeader className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="rounded-xl bg-muted p-3">
                      <Icon className="size-5 text-muted-foreground" />
                    </div>

                    <Badge variant={isAvailable ? "default" : "secondary"}>
                      {isAvailable ? "Disponível" : "Em breve"}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <CardTitle className="text-base">{report.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {report.description}
                    </p>
                  </div>
                </CardHeader>

                <CardContent>
                  {isAvailable && report.to ? (
                    <Button asChild variant="outline" className="w-full">
                      <Link to={report.to}>
                        Abrir
                        <ArrowRight className="ml-2 size-4 transition group-hover:translate-x-1" />
                      </Link>
                    </Button>
                  ) : (
                    <Button disabled variant="outline" className="w-full">
                      Em breve
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>
    </div>
  )
}