import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  transactionAllocationFormSchema,
  type TransactionAllocationFormData,
  type TransactionAllocationFormInput,
} from "@/features/financial-transactions/transaction-allocation-schema"
import { useFunds } from "@/features/funds/hooks/use-funds"
import { useBeneficiaries } from "@/features/beneficiaries/hooks/use-beneficiaries"

type TransactionAllocationFormProps = {
  onSubmit: (data: TransactionAllocationFormData) => void
  isSubmitting?: boolean
  defaultValues?: Partial<TransactionAllocationFormInput>
  submitLabel?: string
}

const NONE_BENEFICIARY_VALUE = "__none__"

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
      amount: defaultValues?.amount ?? 0,
    },
  })

  const selectedFundId = useWatch({ control, name: "fundId" })
  const selectedBeneficiaryId = useWatch({
    control,
    name: "beneficiaryId",
  })

  const fundsQuery = useFunds({
    page: 0,
    size: 100,
  })

  const beneficiariesQuery = useBeneficiaries({
    page: 0,
    size: 100,
  })

  const funds = fundsQuery.data?.content ?? []
  const beneficiaries = beneficiariesQuery.data?.content ?? []

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Fundo</Label>
          <Select
            value={selectedFundId}
            onValueChange={(value) =>
              setValue("fundId", value, {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o fundo" />
            </SelectTrigger>

            <SelectContent>
              {funds.map((fund) => (
                <SelectItem key={fund.id} value={fund.id}>
                  {fund.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {errors.fundId && (
            <p className="text-sm text-destructive">
              {errors.fundId.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Favorecido</Label>
          <Select
            value={selectedBeneficiaryId || NONE_BENEFICIARY_VALUE}
            onValueChange={(value) =>
              setValue(
                "beneficiaryId",
                value === NONE_BENEFICIARY_VALUE ? "" : value,
                {
                  shouldValidate: true,
                },
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Sem favorecido" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value={NONE_BENEFICIARY_VALUE}>
                Sem favorecido
              </SelectItem>

              {beneficiaries.map((beneficiary) => (
                <SelectItem key={beneficiary.id} value={beneficiary.id}>
                  {beneficiary.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {errors.beneficiaryId && (
            <p className="text-sm text-destructive">
              {errors.beneficiaryId.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Valor</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            {...register("amount")}
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