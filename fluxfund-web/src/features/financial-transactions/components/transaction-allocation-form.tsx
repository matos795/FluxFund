import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm, useWatch } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import {
  transactionAllocationFormSchema,
  type TransactionAllocationFormData,
  type TransactionAllocationFormInput,
} from "@/features/financial-transactions/transaction-allocation-schema"
import { useFundOptions } from "../../funds/hooks/use-fund-options"
import { CurrencyInput } from "@/components/form/currency-input"
import { FundComboboxWithCreate } from "../../funds/components/fund-combobox-with-create"
import { getDefaultFundReallocationSuggestion } from "@/utils/fund-reallocation"
import { formatCurrency } from "@/utils/formatters"
import { AlertTriangle } from "lucide-react"
import { useOrganizationSettings } from "@/features/organization-settings/hooks/use-organization-settings"
import type { FinancialTransactionType } from "../financial-transaction-types"
import { FinancialPartyCombobox } from "@/features/financial-parties/components/financial-party-combobox"
import type { FinancialCommitmentAllocationSuggestion, FinancialCommitmentAllocationSummary } from "@/features/financial-commitments/financial-commitment-types"
import { FinancialCommitmentAllocationCard } from "@/features/financial-commitments/components/financial-commitment-allocation-card"
import { SupportAgreementSuggestionCard } from "@/features/support-agreements/components/support-agreement-suggestion-card"

type TransactionAllocationFormProps = {
  onCancel?: () => void
  transactionType: FinancialTransactionType
  onSubmit: (data: TransactionAllocationFormData) => void
  isSubmitting?: boolean
  isApplyingReallocation?: boolean
  defaultValues?: Partial<TransactionAllocationFormInput>
  submitLabel?: string
  maxFinancialCommitmentAmount?: number
  excludedAllocationId?: string
  currentFinancialCommitment?: FinancialCommitmentAllocationSummary | null
  onApplyReallocationSuggestion?: (data: {
    selectedFundId: string
    selectedFundAmount: number
    defaultFundId: string
    defaultFundAmount: number
    sourcePartyId: string
    recipientPartyId: string
    referenceMonth: string
    financialCommitmentId: string
  }) => void
}

export function TransactionAllocationForm({
  onCancel,
  transactionType,
  onSubmit,
  isSubmitting = false,
  isApplyingReallocation = false,
  defaultValues,
  submitLabel = "Adicionar alocação",
  maxFinancialCommitmentAmount,
  excludedAllocationId,
  currentFinancialCommitment,
  onApplyReallocationSuggestion,
}: TransactionAllocationFormProps) {

  const {
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<
    TransactionAllocationFormInput,
    unknown,
    TransactionAllocationFormData
  >({
    resolver: zodResolver(transactionAllocationFormSchema),
    defaultValues: {
      fundId: defaultValues?.fundId ?? "",
      sourcePartyId: defaultValues?.sourcePartyId ?? "",
      recipientPartyId: defaultValues?.recipientPartyId ?? "",
      referenceMonth: defaultValues?.referenceMonth ?? "",
      financialCommitmentId: defaultValues?.financialCommitmentId ?? "",
      clearFinancialCommitment: defaultValues?.clearFinancialCommitment ?? false,
      amount: defaultValues?.amount ?? 0,
    },
  })

  const selectedFundId = useWatch({ control, name: "fundId" })

  const selectedSourcePartyId = useWatch({
    control,
    name: "sourcePartyId",
  })

  const selectedRecipientPartyId = useWatch({
    control,
    name: "recipientPartyId",
  })

  const amount = useWatch({
    control,
    name: "amount",
  })

  const selectedFinancialCommitmentId =
    useWatch({
      control,
      name:
        "financialCommitmentId",
    })

  const currentAmount =
    Math.abs(
      Number(
        amount || 0,
      ),
    )

  const maximumAvailableAmount =
    Math.max(
      maxFinancialCommitmentAmount ??
      currentAmount,
      0,
    )

  const commitmentAvailableAmount =
    Math.min(
      currentAmount,
      maximumAvailableAmount,
    )

  const fundsQuery = useFundOptions()
  const settingsQuery = useOrganizationSettings()

  const funds = fundsQuery.data ?? []
  const settings = settingsQuery.data

  const reallocationSuggestion = getDefaultFundReallocationSuggestion({
    fundId: selectedFundId,
    amount: Number(amount || 0),
    transactionType,
    funds,
    settings,
  })

  const referenceMonth = useWatch({
    control,
    name: "referenceMonth",
  })

  function clearFinancialCommitmentLink() {
    if (
      !selectedFinancialCommitmentId
    ) {
      return
    }

    setValue(
      "financialCommitmentId",
      "",
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    )

    setValue(
      "clearFinancialCommitment",
      true,
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    )
  }

  function handleSourcePartyChange(
    value: string,
  ) {
    if (
      value !==
      (
        selectedSourcePartyId ??
        ""
      )
    ) {
      clearFinancialCommitmentLink()
    }

    setValue(
      "sourcePartyId",
      value,
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    )
  }

  function handleRecipientPartyChange(
    value: string,
  ) {
    if (
      value !==
      (
        selectedRecipientPartyId ??
        ""
      )
    ) {
      clearFinancialCommitmentLink()
    }

    setValue(
      "recipientPartyId",
      value,
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    )
  }

  function handleReferenceMonthChange(
    value: string,
  ) {
    if (
      value !==
      (
        referenceMonth ??
        ""
      )
    ) {
      clearFinancialCommitmentLink()
    }

    setValue(
      "referenceMonth",
      value,
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    )
  }

  function handleSelectFinancialCommitment(
    suggestion:
      FinancialCommitmentAllocationSuggestion,
  ) {
    setValue(
      "financialCommitmentId",
      suggestion
        .commitment
        .id,
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    )

    setValue(
      "clearFinancialCommitment",
      false,
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    )

    setValue(
      "amount",
      suggestion.suggestedAmount,
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    )
  }

  function handleApplySupportAgreementSuggestion(
    suggestion: {
      fundId: string
      beneficiaryId: string
      referenceMonth: string
      amount: number
    },
  ) {
    /*
     * Sustento não usa o vínculo genérico.
     */
    clearFinancialCommitmentLink()

    setValue(
      "fundId",
      suggestion.fundId,
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    )

    setValue(
      "recipientPartyId",
      suggestion.beneficiaryId,
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    )

    setValue(
      "referenceMonth",
      suggestion.referenceMonth,
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    )

    setValue(
      "amount",
      suggestion.amount,
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div
        className={
          transactionType === "INCOME"
            ? "grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_160px_150px]"
            : "grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_160px_150px]"
        }
      >
        {transactionType === "INCOME" && (
          <div className="space-y-2">
            <Label>
              Origem da receita
            </Label>

            <FinancialPartyCombobox
              role="INCOME_SOURCE"
              value={
                selectedSourcePartyId ??
                ""
              }
              allowClear
              clearLabel="Sem origem identificada"
              onChange={
                handleSourcePartyChange
              }
            />

            {errors.sourcePartyId && (
              <p className="text-sm text-destructive">
                {
                  errors
                    .sourcePartyId
                    .message
                }
              </p>
            )}

            <p className="text-xs text-muted-foreground">
              Pessoa ou empresa que enviou o recurso.
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label>
            Fundo
          </Label>

          <FundComboboxWithCreate
            value={
              selectedFundId
            }
            allowClear={false}
            onChange={(value) =>
              setValue(
                "fundId",
                value,
                {
                  shouldValidate:
                    true,
                },
              )
            }
          />

          {errors.fundId && (
            <p className="text-sm text-destructive">
              {
                errors
                  .fundId
                  .message
              }
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>
            {transactionType ===
              "INCOME"
              ? "Destinatário / favorecido"
              : "Recebedor do pagamento"}
          </Label>

          <FinancialPartyCombobox
            role="PAYMENT_RECIPIENT"
            value={
              selectedRecipientPartyId ??
              ""
            }
            allowClear
            clearLabel={
              transactionType ===
                "INCOME"
                ? "Sem destinação individual"
                : "Sem recebedor identificado"
            }
            placeholder={
              transactionType ===
                "INCOME"
                ? "Sem destinação individual"
                : "Sem recebedor identificado"
            }
            onChange={
              handleRecipientPartyChange
            }
          />

          {errors.recipientPartyId && (
            <p className="text-sm text-destructive">
              {
                errors
                  .recipientPartyId
                  .message
              }
            </p>
          )}

          {transactionType ===
            "INCOME" && (
              <p className="text-xs text-muted-foreground">
                Use quando a receita foi destinada a uma pessoa ou projeto responsável.
              </p>
            )}
        </div>

        <div className="space-y-2">
          <Label>
            Competência
          </Label>

          <Input
            id="referenceMonth"
            type="month"
            value={
              referenceMonth ??
              ""
            }
            onChange={(event) =>
              handleReferenceMonthChange(
                event.target.value,
              )
            }
          />

          {errors.referenceMonth && (
            <p className="text-sm text-destructive">
              {
                errors
                  .referenceMonth
                  .message
              }
            </p>
          )}

          <p className="text-xs text-muted-foreground">
            Padrão: mês da baixa. Altere somente se este valor corresponder a outro mês.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">
            Valor
          </Label>

          <Controller
            name="amount"
            control={control}
            render={({
              field,
            }) => (
              <CurrencyInput
                id="amount"
                value={
                  field.value as
                  | number
                  | null
                  | undefined
                }
                onValueChange={
                  field.onChange
                }
              />
            )}
          />

          {errors.amount && (
            <p className="text-sm text-destructive">
              {
                errors
                  .amount
                  .message
              }
            </p>
          )}
        </div>
      </div>

      {transactionType !==
        "TRANSFER" && (
          <FinancialCommitmentAllocationCard
            transactionType={
              transactionType
            }
            sourcePartyId={
              selectedSourcePartyId
            }
            recipientPartyId={
              selectedRecipientPartyId
            }
            fundId={
              selectedFundId
            }
            referenceMonth={
              referenceMonth
            }
            availableAmount={
              commitmentAvailableAmount
            }
            currentAmount={
              currentAmount
            }
            excludedAllocationId={
              excludedAllocationId
            }
            selectedCommitmentId={
              selectedFinancialCommitmentId
            }
            currentCommitment={
              currentFinancialCommitment
            }
            onSelect={
              handleSelectFinancialCommitment
            }
            onClear={
              clearFinancialCommitmentLink
            }
          />
        )}

      {transactionType ===
        "EXPENSE" && (
          <SupportAgreementSuggestionCard
            transactionType={
              transactionType
            }
            beneficiaryId={
              selectedRecipientPartyId
            }
            fundId={
              selectedFundId
            }
            referenceMonth={
              referenceMonth
            }
            maxAmount={
              commitmentAvailableAmount
            }
            autoApply={
              false
            }
            onApply={
              handleApplySupportAgreementSuggestion
            }
          />
        )}

      {reallocationSuggestion && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <div className="flex gap-2">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />

            <div className="space-y-2">
              <p className="font-medium">
                O fundo selecionado não possui saldo suficiente.
              </p>

              <p>
                Saldo disponível em{" "}
                <strong>{reallocationSuggestion.selectedFund.label}</strong>:{" "}
                {formatCurrency(
                  Math.max(reallocationSuggestion.selectedFund.currentBalance, 0),
                )}.
              </p>

              <p>
                Sugestão: alocar{" "}
                <strong>
                  {formatCurrency(reallocationSuggestion.selectedFundAmount)}
                </strong>{" "}
                em {reallocationSuggestion.selectedFund.label} e{" "}
                <strong>
                  {formatCurrency(reallocationSuggestion.defaultFundAmount)}
                </strong>{" "}
                em {reallocationSuggestion.defaultFund.label}.
              </p>

              <p className="text-xs">
                Nada será salvo automaticamente. Revise as alocações antes de enviar.
              </p>
              {onApplyReallocationSuggestion && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isSubmitting || isApplyingReallocation}
                  onClick={() =>
                    onApplyReallocationSuggestion({
                      selectedFundId: reallocationSuggestion.selectedFund.id,
                      selectedFundAmount: reallocationSuggestion.selectedFundAmount,
                      defaultFundId: reallocationSuggestion.defaultFund.id,
                      defaultFundAmount: reallocationSuggestion.defaultFundAmount,
                      sourcePartyId: selectedSourcePartyId ?? "",
                      recipientPartyId: selectedRecipientPartyId ?? "",
                      referenceMonth: referenceMonth ?? "",
                      financialCommitmentId: selectedFinancialCommitmentId ?? "",
                    })
                  }
                >
                  {isApplyingReallocation
                    ? "Aplicando..."
                    : "Aplicar sugestão"}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
        )}

        <Button
          type="submit"
          disabled={
            isSubmitting ||
            fundsQuery.isLoading
          }
        >
          {isSubmitting ? "Salvando..." : submitLabel}
        </Button>
      </div>
    </form >
  )
}