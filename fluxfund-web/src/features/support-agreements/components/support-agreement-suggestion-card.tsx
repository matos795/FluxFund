import { useCallback, useEffect, useMemo, useRef } from "react"
import { HandCoins } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/utils/formatters"
import type { FinancialTransactionType } from "@/features/financial-transactions/financial-transaction-types"
import { useSupportAgreementSuggestions } from "../hooks/use-support-agreement-suggestions"

type SupportAgreementSuggestionCardProps = {
  beneficiaryId?: string | null
  transactionType: FinancialTransactionType
  referenceMonth?: string | null
  remainingAmount?: number
  autoApply?: boolean
  fundId?: string | null
  referenceDateFallback?: string | null
  onApply: (data: {
    fundId: string
    beneficiaryId: string
    referenceMonth: string
    amount: number
  }) => void
}

export function SupportAgreementSuggestionCard({
  fundId,
  beneficiaryId,
  transactionType,
  referenceMonth,
  referenceDateFallback,
  remainingAmount,
  onApply,
  autoApply = false,
}: SupportAgreementSuggestionCardProps) {
  const shouldSearch = transactionType === "EXPENSE" && Boolean(beneficiaryId)

  const effectiveReferenceMonth =
    referenceMonth ||
    referenceDateFallback?.slice(0, 7) ||
    ""

  const referenceDate = effectiveReferenceMonth
    ? `${effectiveReferenceMonth}-01`
    : undefined

  const { data: suggestions = [], isLoading } = useSupportAgreementSuggestions(
    {
      beneficiaryId: beneficiaryId ?? "",
      referenceDate,
    },
    { enabled: shouldSearch },
  )

  const visibleSuggestions = useMemo(
    () =>
      suggestions.filter(
        (agreement) => agreement.fund.id !== fundId,
      ),
    [fundId, suggestions],
  )

  const autoAppliedKeyRef = useRef<string | null>(null)

  const buildSuggestion = useCallback(
    (agreement: (typeof suggestions)[number]) => {
      const availableAmount = Math.max(
        Number(remainingAmount ?? agreement.amount),
        0,
      )

      const suggestedAmount =
        availableAmount > 0
          ? Math.min(Number(agreement.amount), availableAmount)
          : Number(agreement.amount)

      return {
        fundId: agreement.fund.id,
        beneficiaryId: agreement.beneficiary.id,
        referenceMonth: effectiveReferenceMonth,
        amount: suggestedAmount,
      }
    },
    [effectiveReferenceMonth, remainingAmount],
  )

  useEffect(() => {
    if (
      !autoApply ||
      !shouldSearch ||
      isLoading ||
      visibleSuggestions.length !== 1
    ) {
      return
    }

    const agreement = visibleSuggestions[0]

    if (!agreement) {
      return
    }

    const autoApplyKey = `${beneficiaryId}:${referenceDate ?? ""}:${agreement.id}`

    if (autoAppliedKeyRef.current === autoApplyKey) {
      return
    }

    autoAppliedKeyRef.current = autoApplyKey

    const timeoutId = window.setTimeout(() => {
      onApply(buildSuggestion(agreement))

      toast.info(
        "Compromisso ativo aplicado automaticamente. Revise antes de salvar.",
      )
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [
    autoApply,
    beneficiaryId,
    buildSuggestion,
    isLoading,
    onApply,
    referenceDate,
    shouldSearch,
    visibleSuggestions,
  ])

  if (!shouldSearch || isLoading || visibleSuggestions.length === 0) {
    return null
  }

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950">
      <div className="flex gap-2">
        <HandCoins className="mt-0.5 size-4 shrink-0" />

        <div className="space-y-3">
          <div className="space-y-1">
            <p className="font-medium">Compromisso ativo encontrado.</p>
            <p className="text-xs text-emerald-900/80">
              Use esta sugestão para evitar alocar o repasse no fundo errado.
              Nada será salvo automaticamente.
            </p>
          </div>

          <div className="space-y-2">
            {visibleSuggestions.map((agreement) => {
              const suggestion = buildSuggestion(agreement)
              const suggestedAmount = suggestion.amount

              return (
                <div
                  key={agreement.id}
                  className="flex flex-col gap-2 rounded-md border border-emerald-200 bg-background/70 p-3 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-medium">
                      {agreement.fund.name} ·{" "}
                      {formatCurrency(Number(agreement.amount))}
                    </p>

                    {suggestedAmount < Number(agreement.amount) && (
                      <p className="text-xs text-muted-foreground">
                        O compromisso é maior que o valor restante. A sugestão
                        usará {formatCurrency(suggestedAmount)}.
                      </p>
                    )}
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onApply(suggestion)}
                  >
                    Usar compromisso
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}