import {
  History,
  Sparkles,
} from "lucide-react"

import {
  Badge,
} from "@/components/ui/badge"

import {
  Button,
} from "@/components/ui/button"

import type {
  FinancialTransactionClassificationSuggestion,
} from "../financial-transaction-types"

type Props = {
  suggestion:
    FinancialTransactionClassificationSuggestion

  autoFillEnabled:
    boolean

  onApply:
    () => void
}

const confidenceLabels = {
  HIGH:
    "Alta confiança",

  MEDIUM:
    "Confiança média",

  LOW:
    "Baixa confiança",
} as const

export function ClassificationSuggestionCard({
  suggestion,
  autoFillEnabled,
  onApply,
}: Props) {
  if (
    !suggestion.available ||
    !suggestion.confidence ||
    !suggestion.evidence ||
    !suggestion.category
  ) {
    return null
  }

  const {
    confidence,
    evidence,
  } = suggestion

  const canApply =
    confidence ===
      "MEDIUM" ||
    (
      confidence ===
        "HIGH" &&
      !autoFillEnabled
    )

  const sourceNames =
    Array.from(
      new Set(
        suggestion.allocations
          .map(
            allocation =>
              allocation
                .sourceParty
                ?.name,
          )
          .filter(
            (
              name,
            ): name is string =>
              Boolean(
                name,
              ),
          ),
      ),
    )

  const recipientNames =
    Array.from(
      new Set(
        suggestion.allocations
          .map(
            allocation =>
              allocation
                .recipientParty
                ?.name ??
              allocation
                .beneficiary
                ?.name,
          )
          .filter(
            (
              name,
            ): name is string =>
              Boolean(
                name,
              ),
          ),
      ),
    )

  return (
    <div className="space-y-4 rounded-xl border bg-muted/20 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex gap-3">
          <History className="mt-0.5 size-5 text-muted-foreground" />

          <div>
            <p className="font-medium">
              Sugestão pelo histórico
            </p>

            <p className="text-sm text-muted-foreground">
              Baseada em{" "}
              {
                evidence.historyCount
              }{" "}
              movimentações anteriores.
            </p>
          </div>
        </div>

        <Badge
          variant={
            confidence ===
              "LOW"
              ? "outline"
              : "secondary"
          }
        >
          {
            confidenceLabels[
              confidence
            ]
          }
        </Badge>
      </div>

      <div className="grid gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-lg border bg-background p-3">
          <p className="text-xs text-muted-foreground">
            Categoria
          </p>

          <p className="mt-1 font-medium">
            {
              suggestion
                .category
                .name
            }
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            {
              evidence
                .categoryMatchCount
            }
            /
            {
              evidence
                .historyCount
            }{" "}
            históricos ·{" "}
            {
              evidence
                .categoryAgreementPercent
            }
            %
          </p>
        </div>

        <div className="rounded-lg border bg-background p-3">
          <p className="text-xs text-muted-foreground">
            Padrão de alocação
          </p>

          {evidence
            .allocationHistoryCount >
          0 ? (
            <>
              <p className="mt-1 font-medium">
                {
                  evidence
                    .allocationMatchCount
                }
                /
                {
                  evidence
                    .allocationHistoryCount
                }{" "}
                iguais
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                {
                  evidence
                    .allocationAgreementPercent
                }
                % de concordância
              </p>
            </>
          ) : (
            <p className="mt-1 text-muted-foreground">
              Sem histórico de alocação comparável
            </p>
          )}
        </div>
      </div>

      {sourceNames.length >
        0 && (
        <p className="text-sm">
          <span className="text-muted-foreground">
            Origem sugerida:{" "}
          </span>

          <strong>
            {
              sourceNames.join(
                ", ",
              )
            }
          </strong>
        </p>
      )}

      {recipientNames.length >
        0 && (
        <p className="text-sm">
          <span className="text-muted-foreground">
            Recebedor / destinatário:{" "}
          </span>

          <strong>
            {
              recipientNames.join(
                ", ",
              )
            }
          </strong>
        </p>
      )}

      {confidence ===
        "HIGH" &&
        autoFillEnabled && (
          <div className="flex gap-2 text-sm text-muted-foreground">
            <Sparkles className="mt-0.5 size-4 shrink-0" />

            <p>
              Os campos compatíveis foram
              pré-preenchidos automaticamente.
              Revise antes de salvar.
            </p>
          </div>
        )}

      {confidence ===
        "LOW" && (
          <p className="text-sm text-muted-foreground">
            O histórico ainda é insuficiente ou
            inconsistente. A sugestão não será
            aplicada automaticamente.
          </p>
        )}

      {canApply && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={
            onApply
          }
        >
          <Sparkles className="mr-2 size-4" />

          Aplicar sugestão
        </Button>
      )}
    </div>
  )
}