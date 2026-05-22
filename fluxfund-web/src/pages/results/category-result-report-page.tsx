import { ArrowLeft, BarChart3 } from "lucide-react"
import { Link } from "react-router-dom"

import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function CategoryResultReportPage() {
  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" className="px-0">
        <Link to="/reports">
          <ArrowLeft className="mr-2 size-4" />
          Voltar para relatórios
        </Link>
      </Button>

      <PageHeader
        title="Resultado por Categoria"
        description="Analise receitas, despesas e resultado agrupados pelo plano de contas."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Receitas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 0,00</div>
            <p className="text-xs text-muted-foreground">
              Total de entradas no período.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Despesas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 0,00</div>
            <p className="text-xs text-muted-foreground">
              Total de saídas no período.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Resultado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 0,00</div>
            <p className="text-xs text-muted-foreground">
              Receitas menos despesas.
            </p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="rounded-xl bg-muted p-2">
            <BarChart3 className="size-5 text-muted-foreground" />
          </div>

          <div>
            <CardTitle>Resumo por categoria</CardTitle>
            <p className="text-sm text-muted-foreground">
              Este relatório será alimentado pelo backend no próximo passo.
            </p>
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
            Nenhum dado carregado ainda.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}