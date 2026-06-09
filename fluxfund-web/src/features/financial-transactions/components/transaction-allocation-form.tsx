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
import { useBeneficiaryOptions } from "../../beneficiaries/hooks/use-beneficiary-options"
import { useFundOptions } from "../../funds/hooks/use-fund-options"
import { CurrencyInput } from "@/components/form/currency-input"
import { FundComboboxWithCreate } from "../../funds/components/fund-combobox-with-create"
import { BeneficiaryComboboxWithCreate } from "../../beneficiaries/components/beneficiary-combobox-with-create"
import { getDefaultFundReallocationSuggestion } from "@/utils/fund-reallocation"
import { formatCurrency } from "@/utils/formatters"
import { AlertTriangle } from "lucide-react"
import { useOrganizationSettings } from "@/features/organization-settings/hooks/use-organization-settings"
import type { FinancialTransactionType } from "../financial-transaction-types"

type TransactionAllocationFormProps = {
  onCancel?: () => void
  transactionType: FinancialTransactionType
  onSubmit: (data: TransactionAllocationFormData) => void
  isSubmitting?: boolean
  defaultValues?: Partial<TransactionAllocationFormInput>
  submitLabel?: string
  onApplyReallocationSuggestion?: (data: {
    selectedFundId: string
    selectedFundAmount: number
    defaultFundId: string
    defaultFundAmount: number
    beneficiaryId: string
    referenceMonth: string
  }) => void
}

export function TransactionAllocationForm({
  onCancel,
  transactionType,
  onSubmit,
  isSubmitting = false,
  defaultValues,
  submitLabel = "Adicionar alocação",
  onApplyReallocationSuggestion,
}: TransactionAllocationFormProps) {

  const {
    register,
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
      beneficiaryId: defaultValues?.beneficiaryId ?? "",
      referenceMonth: defaultValues?.referenceMonth ?? "",
      amount: defaultValues?.amount ?? 0,
    },
  })

  const selectedFundId = useWatch({ control, name: "fundId" })
  const selectedBeneficiaryId = useWatch({
    control,
    name: "beneficiaryId",
  })
  const amount = useWatch({
    control,
    name: "amount",
  })

  const fundsQuery = useFundOptions()
  const beneficiariesQuery = useBeneficiaryOptions()
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-2">
          <Label>Fundo</Label>
          <FundComboboxWithCreate
            value={selectedFundId}
            allowClear={false}
            onChange={(value) =>
              setValue("fundId", value, {
                shouldValidate: true,
              })
            }
          />

          {errors.fundId && (
            <p className="text-sm text-destructive">
              {errors.fundId.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Favorecido</Label>
          <BeneficiaryComboboxWithCreate
            value={selectedBeneficiaryId ?? ""}
            allowClear
            clearLabel="Sem favorecido"
            onChange={(value) =>
              setValue("beneficiaryId", value, {
                shouldValidate: true,
              })
            }
          />

          {errors.beneficiaryId && (
            <p className="text-sm text-destructive">
              {errors.beneficiaryId.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Competência</Label>
          <Input
            id="referenceMonth"
            type="month"
            {...register("referenceMonth")}
          />
          {errors.referenceMonth && (
            <p className="text-sm text-destructive">
              {errors.referenceMonth.message}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Para repasses de outro mês.
          </p>
        </div>

                <div className="space-y-2">
          <Label htmlFor="amount">Valor</Label>
          <Controller
            name="amount"
            control={control}
            render={({ field }) => (
              <CurrencyInput
                id="amount"
                value={field.value as number | null | undefined}
                onValueChange={field.onChange}
              />
            )}
          />

          {errors.amount && (
            <p className="text-sm text-destructive">
              {errors.amount.message}
            </p>
          )}
        </div>
      </div>

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
                    onClick={() =>
                      onApplyReallocationSuggestion({
                        selectedFundId: reallocationSuggestion.selectedFund.id,
                        selectedFundAmount: reallocationSuggestion.selectedFundAmount,
                        defaultFundId: reallocationSuggestion.defaultFund.id,
                        defaultFundAmount: reallocationSuggestion.defaultFundAmount,
                        beneficiaryId: selectedBeneficiaryId ?? "",
                        referenceMonth: referenceMonth ?? "",
                      })
                    }
                  >
                    Aplicar sugestão
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
            fundsQuery.isLoading ||
            beneficiariesQuery.isLoading
          }
        >
          {isSubmitting ? "Salvando..." : submitLabel}
        </Button>
      </div>
    </form >
  )
}