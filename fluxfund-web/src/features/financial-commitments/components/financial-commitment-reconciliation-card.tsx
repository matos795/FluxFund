import {
  useEffect,
  useState,
} from "react"

import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  Link2,
  SearchX,
} from "lucide-react"

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
} from "@/components/ui/card"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  financialCommitmentTypeLabels,
} from "../financial-commitment-labels"

import type {
  FinancialCommitmentReconciliationItem,
} from "../financial-commitment-types"

import {
  formatCurrency,
  formatDate,
  formatReferenceMonth,
} from "@/utils/formatters"

type Props = {
  item:
    FinancialCommitmentReconciliationItem

  isLinking: boolean

  onLink: (
    financialCommitmentId:
      string,
  ) => void
}

const statusContent = {
  EXACT: {
    title:
      "Correspondência exata",

    description:
      "Existe apenas um compromisso compatível com contato, competência, fundo e valor.",

    icon:
      CheckCircle2,

    className:
      "border-emerald-200 bg-emerald-50 text-emerald-950",
  },

  REVIEW: {
    title:
      "Revisão necessária",

    description:
      "Há candidatos, mas algum detalhe precisa ser confirmado antes do vínculo.",

    icon:
      AlertTriangle,

    className:
      "border-amber-200 bg-amber-50 text-amber-950",
  },

  NO_MATCH: {
    title:
      "Sem correspondência",

    description:
      "Nenhum compromisso financeiro genérico corresponde a esta alocação.",

    icon:
      SearchX,

    className:
      "border-muted bg-muted/30 text-foreground",
  },
} as const

export function FinancialCommitmentReconciliationCard({
  item,
  isLinking,
  onLink,
}: Props) {
  const defaultCommitmentId =
    item.suggestions.length === 1
      ? item.suggestions[0]
          .commitment.id
      : ""

  const [
    selectedCommitmentId,
    setSelectedCommitmentId,
  ] = useState(
    defaultCommitmentId,
  )

  useEffect(() => {
    const desired =
      item.suggestions.length === 1
        ? item.suggestions[0].commitment.id
        : ""

    if (selectedCommitmentId !== desired) {
      // Defer the state update to avoid synchronous setState in effect
      const t = window.setTimeout(() => {
        setSelectedCommitmentId(desired)
      }, 0)

      return () => window.clearTimeout(t)
    }
  }, [
    item.allocationId,
    item.suggestions,
    selectedCommitmentId,
  ])

  const selectedSuggestion =
    item.suggestions.find(
      (suggestion) =>
        suggestion.commitment.id ===
        selectedCommitmentId,
    )

  const status =
    statusContent[
      item.matchStatus
    ]

  const StatusIcon =
    status.icon

  const TransactionIcon =
    item.transactionType ===
    "INCOME"
      ? ArrowDownToLine
      : ArrowUpFromLine

  const mainParty =
    item.transactionType ===
    "INCOME"
      ? item.sourceParty
      : item.recipientParty

  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-4 border-b bg-muted/10">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
          <div className="flex min-w-0 gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <TransactionIcon className="size-5" />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">
                  {
                    item.description ||
                    "Sem descrição"
                  }
                </p>

                <Badge variant="outline">
                  {item.transactionType ===
                  "INCOME"
                    ? "Receita"
                    : "Despesa"}
                </Badge>
              </div>

              <p className="mt-1 text-sm text-muted-foreground">
                {item.accountName}
                {" · "}
                {formatDate(
                  item.settlementDate,
                )}
              </p>
            </div>
          </div>

          <p className="shrink-0 text-lg font-semibold">
            {formatCurrency(
              item.amount,
            )}
          </p>
        </div>

        <div
          className={`flex gap-3 rounded-lg border p-3 text-sm ${status.className}`}
        >
          <StatusIcon className="mt-0.5 size-4 shrink-0" />

          <div>
            <p className="font-medium">
              {status.title}
            </p>

            <p className="mt-0.5 text-xs opacity-80">
              {
                status.description
              }
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 p-5">
        <div className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">
              Contato principal
            </p>

            <p className="mt-1 font-medium">
              {mainParty?.name ??
                "Não identificado"}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">
              Destinatário
            </p>

            <p className="mt-1 font-medium">
              {item.recipientParty
                ?.name ??
                "Sem destinação"}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">
              Fundo realizado
            </p>

            <p className="mt-1 font-medium">
              {item.fund.name}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">
              Competência
            </p>

            <p className="mt-1 font-medium">
              {formatReferenceMonth(
                item.referenceMonth,
              )}
            </p>
          </div>
        </div>

        {item.matchStatus ===
        "NO_MATCH" ? (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            Esta movimentação pode ser uma despesa comum ou um repasse de Sustento. Ela não será alterada e não entrará nos relatórios de compromissos genéricos.
          </div>
        ) : (
          <div className="space-y-4 border-t pt-5">
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Compromisso correspondente
              </p>

              <Select
                value={
                  selectedCommitmentId
                }
                onValueChange={
                  setSelectedCommitmentId
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o compromisso correto" />
                </SelectTrigger>

                <SelectContent>
                  {item.suggestions.map(
                    (suggestion) => (
                      <SelectItem
                        key={
                          suggestion
                            .commitment.id
                        }
                        value={
                          suggestion
                            .commitment.id
                        }
                      >
                        {
                          financialCommitmentTypeLabels[
                            suggestion
                              .commitment
                              .commitmentType
                          ]
                        }
                        {" · "}
                        {
                          suggestion
                            .commitment
                            .party.name
                        }
                        {" · "}
                        {
                          suggestion
                            .commitment
                            .plannedFund
                            .name
                        }
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedSuggestion && (
              <div className="grid gap-3 rounded-xl border bg-muted/20 p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Valor previsto
                  </p>

                  <p className="mt-1 font-medium">
                    {formatCurrency(
                      selectedSuggestion
                        .commitment
                        .amount,
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Já realizado
                  </p>

                  <p className="mt-1 font-medium">
                    {formatCurrency(
                      selectedSuggestion
                        .realizedAmount,
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Ainda pendente
                  </p>

                  <p className="mt-1 font-medium">
                    {formatCurrency(
                      selectedSuggestion
                        .remainingAmount,
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Fundo previsto
                  </p>

                  <p className="mt-1 font-medium">
                    {
                      selectedSuggestion
                        .commitment
                        .plannedFund
                        .name
                    }
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-col justify-between gap-3 border-t pt-4 sm:flex-row sm:items-center">
              <p className="text-xs text-muted-foreground">
                A confirmação altera apenas o vínculo desta alocação. Valores, fundo, contato e competência não serão modificados.
              </p>

              <Button
                type="button"
                disabled={
                  !selectedCommitmentId ||
                  isLinking
                }
                onClick={() =>
                  onLink(
                    selectedCommitmentId,
                  )
                }
              >
                <Link2 className="mr-2 size-4" />

                {isLinking
                  ? "Vinculando..."
                  : "Confirmar vínculo"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}