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
import { useBeneficiaryOptions } from "../beneficiaries/hooks/use-beneficiary-options"
import { useFundOptions } from "../funds/hooks/use-fund-options"
import { CurrencyInput } from "@/components/form/currency-input"
import { FundComboboxWithCreate } from "../funds/components/fund-combobox-with-create"
import { BeneficiaryComboboxWithCreate } from "../beneficiaries/components/beneficiary-combobox-with-create"

type TransactionAllocationFormProps = {
  onSubmit: (data: TransactionAllocationFormData) => void
  isSubmitting?: boolean
  defaultValues?: Partial<TransactionAllocationFormInput>
  submitLabel?: string
}

export function TransactionAllocationForm({
  onSubmit,
  isSubmitting = false,
  defaultValues,
  submitLabel = "Adicionar alocação",
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

  const fundsQuery = useFundOptions()
  const beneficiariesQuery = useBeneficiaryOptions()

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
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

      <div className="flex justify-end">
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
    </form>
  )
}