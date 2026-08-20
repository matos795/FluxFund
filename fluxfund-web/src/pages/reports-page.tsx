import {
  ArrowRight,
  BarChart3,
  CalendarRange,
  CircleDollarSign,
  ClipboardCheck,
  FolderArchive,
  FolderTree,
  HandCoins,
  Landmark,
  ListChecks,
  ShieldCheck,
  TrendingUp,
  UsersRound,
} from "lucide-react"

import {
  Link,
} from "react-router-dom"

import {
  PageHeader,
} from "@/components/layout/page-header"

import {
  Badge,
} from "@/components/ui/badge"

import {
  Button,
} from "@/components/ui/button"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const reportGroups = [
  {
    title:
      "Financeiro",

    description:
      "Como está o dinheiro?",

    reports: [
      {
        title:
          "Resultado por categoria",

        question:
          "Estou no lucro ou prejuízo?",

        description:
          "Compare receitas, despesas e resultado pelo plano de contas.",

        icon:
          BarChart3,

        to:
          "/reports/category-result",

        available:
          true,
      },

      {
        title:
          "Fluxo de caixa",

        question:
          "Quanto tenho nas contas?",

        description:
          "Veja entradas, saídas, transferências e saldos bancários reais.",

        icon:
          Landmark,

        to:
          "/reports/account-cash-flow",

        available:
          true,
      },

      {
        title:
          "Fundos e projetos",

        question:
          "Quanto tenho para cada finalidade?",

        description:
          "Acompanhe recursos destinados internamente a fundos e projetos.",

        icon:
          FolderTree,

        to:
          "/reports/funds",

        available:
          true,
      },

      {
        title:
          "Relacionamentos financeiros",

        question:
          "De quem vêm e para quem vão os recursos?",

        description:
          "Analise fontes de receita, destinatários, concentração, recorrência e cumprimento histórico.",

        icon:
          UsersRound,

        to:
          "/reports/financial-relationships",

        available:
          true,
      },

      {
        title:
          "Previsão financeira",

        question:
          "O que deverá entrar e sair?",

        description:
          "Projete compromissos futuros e o impacto esperado no caixa.",

        icon:
          TrendingUp,

        to:
          "/reports/financial-forecast",

        available:
          true,
      },
    ],
  },

  {
    title:
      "Compromissos e repasses",

    description:
      "O que falta receber ou pagar?",

    reports: [
      {
        title:
          "Prestação de contas / Sustento",

        question:
          "Quanto devo repassar?",

        description:
          "Acompanhe recursos destinados, repassados e ainda pendentes por favorecido.",

        icon:
          HandCoins,

        to:
          "/reports/accountability",

        available:
          true,
      },

      {
        title:
          "Compromissos a receber",

        question:
          "Quem ainda não contribuiu ou pagou?",

        description:
          "Compare doações, clientes e contribuições previstas com o realizado.",

        icon:
          CircleDollarSign,

        to:
          "/reports/commitments-receivable",

        available:
          true,
      },

      {
        title:
          "Compromissos a pagar",

        question:
          "Quais pagamentos ainda estão pendentes?",

        description:
          "Compare fornecedores, salários, serviços e reembolsos previstos com o pago.",

        icon:
          CalendarRange,

        to:
          "/reports/commitments-payable",

        available:
          true,
      },
    ],
  },

  {
    title:
      "Controle e conformidade",

    description:
      "O que precisa ser conferido?",

    reports: [
      {
        title:
          "Pendências operacionais",

        question:
          "O que falta corrigir hoje?",

        description:
          "Localize classificações, alocações, documentos, faturas e fundos pendentes.",

        icon:
          ListChecks,

        to:
          "/reports/pending-items",

        available:
          true,
      },

      {
        title:
          "Dossiê de fechamento",

        question:
          "O fechamento está documentado?",

        description:
          "Organize extratos, lançamentos, comprovantes, notas e recibos.",

        icon:
          FolderArchive,

        to:
          "/reports/closing-dossier",

        available:
          true,
      },

      {
        title:
          "Auditoria",

        question:
          "Quem alterou cada informação?",

        description:
          "Consulte ações críticas, responsáveis, datas e entidades afetadas.",

        icon:
          ShieldCheck,

        to:
          "/reports/audit-logs",

        available:
          true,
      },
    ],
  },
]

const quickQuestions = [
  {
    label:
      "Estou no lucro?",

    to:
      "/reports/category-result",
  },

  {
    label:
      "Quanto tenho nos bancos?",

    to:
      "/reports/account-cash-flow",
  },

  {
    label:
      "Quanto tenho em cada fundo?",

    to:
      "/reports/funds",
  },

  {
    label:
      "Quanto devo repassar?",

    to:
      "/reports/accountability",
  },

  {
    label:
      "Quem ainda não contribuiu?",

    to:
      "/reports/commitments-receivable",
  },

  {
    label:
      "De quem vêm e para quem vão os recursos?",

    to:
      "/reports/financial-relationships",
  },

  {
    label:
      "O que falta documentar?",

    to:
      "/reports/pending-items",
  },

  {
    label:
      "O que entra e sai nos próximos meses?",

    to:
      "/reports/financial-forecast",
  },
]

export function ReportsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Central de relatórios"
        description="Escolha primeiro a pergunta que precisa responder. O FluxFund apresenta o relatório mais adequado."
      />

      <section className="overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-background p-6">
        <div className="flex gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <ClipboardCheck className="size-6" />
          </div>

          <div>
            <Badge variant="secondary">
              11 relatórios organizados
            </Badge>

            <h2 className="mt-3 text-xl font-semibold">
              O que você precisa descobrir?
            </h2>

            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Use os atalhos abaixo ou navegue pelos grupos financeiro, compromissos e controle.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {quickQuestions.map(
            (item) => (
              <Button
                key={
                  item.label
                }
                asChild
                size="sm"
                variant="outline"
                className="bg-background/80"
              >
                <Link
                  to={
                    item.to
                  }
                >
                  {
                    item.label
                  }

                  <ArrowRight className="ml-2 size-3.5" />
                </Link>
              </Button>
            ),
          )}
        </div>
      </section>

      {reportGroups.map(
        (group) => (
          <section
            key={
              group.title
            }
            className="space-y-4"
          >
            <div>
              <h2 className="text-lg font-semibold">
                {group.title}
              </h2>

              <p className="text-sm text-muted-foreground">
                {group.description}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {group.reports.map(
                (report) => {
                  const Icon =
                    report.icon

                  return (
                    <Card
                      key={
                        report.title
                      }
                      className="group flex flex-col justify-between transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <CardHeader className="space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="rounded-xl bg-primary/10 p-3 text-primary">
                            <Icon className="size-5" />
                          </div>

                          <Badge
                            variant={
                              report.available
                                ? "default"
                                : "secondary"
                            }
                          >
                            {report.available
                              ? "Disponível"
                              : "Próximo bloco"}
                          </Badge>
                        </div>

                        <div>
                          <CardTitle className="text-base">
                            {report.title}
                          </CardTitle>

                          <p className="mt-2 text-sm font-medium">
                            {report.question}
                          </p>

                          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                            {report.description}
                          </p>
                        </div>
                      </CardHeader>

                      <CardContent>
                        {report.available &&
                          report.to ? (
                          <Button
                            asChild
                            variant="outline"
                            className="w-full"
                          >
                            <Link
                              to={
                                report.to
                              }
                            >
                              Abrir relatório

                              <ArrowRight className="ml-2 size-4 transition group-hover:translate-x-1" />
                            </Link>
                          </Button>
                        ) : (
                          <Button
                            disabled
                            variant="outline"
                            className="w-full"
                          >
                            Em desenvolvimento
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )
                },
              )}
            </div>
          </section>
        ),
      )}
    </div>
  )
}