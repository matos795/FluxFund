import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"

import { EntityCombobox } from "@/components/form/entity-combobox"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  supportAgreementSchema,
  type SupportAgreementFormData,
  type SupportAgreementFormInput,
} from "../support-agreement-schema"
import { useBeneficiaryOptions } from "@/features/beneficiaries/hooks/use-beneficiary-options"
import { CurrencyInput } from "@/components/form/currency-input"
import { FundComboboxWithCreate } from "@/features/funds/components/fund-combobox-with-create"

type SupportAgreementFormProps = {
  defaultValues?: Partial<SupportAgreementFormInput>
  submitLabel?: string
  isSubmitting?: boolean
  lockBeneficiary?: boolean
  onSubmit: (data: SupportAgreementFormData) => void
}

export function SupportAgreementForm({
  defaultValues,
  submitLabel = "Salvar compromisso",
  isSubmitting = false,
  lockBeneficiary = false,
  onSubmit,
}: SupportAgreementFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SupportAgreementFormInput, unknown, SupportAgreementFormData>({
    resolver: zodResolver(supportAgreementSchema),
    defaultValues: {
      beneficiaryId: defaultValues?.beneficiaryId ?? "",
      fundId: defaultValues?.fundId ?? "",
      amount: defaultValues?.amount ?? 0,
      startDate: defaultValues?.startDate ?? "",
      endDate: defaultValues?.endDate ?? "",
      description: defaultValues?.description ?? "",
      active: defaultValues?.active ?? true,
    },
  })

  const beneficiariesQuery = useBeneficiaryOptions()

  const beneficiaries = beneficiariesQuery.data ?? []

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <Label>Favorecido</Label>
        <Controller
          name="beneficiaryId"
          control={control}
          render={({ field }) => (
            <EntityCombobox
              value={field.value}
              disabled={lockBeneficiary}
              placeholder="Selecione um favorecido"
              searchPlaceholder="Buscar favorecido..."
              emptyMessage="Nenhum favorecido encontrado."
              options={beneficiaries.map((beneficiary) => ({
                value: beneficiary.id,
                label: beneficiary.label,
              }))}
              allowClear={false}
              onChange={field.onChange}
            />
          )}
        />
        {errors.beneficiaryId && (
          <p className="text-sm text-destructive">{errors.beneficiaryId.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Fundo</Label>
        <Controller
          name="fundId"
          control={control}
          render={({ field }) => (
            <FundComboboxWithCreate
              value={field.value}
              allowClear={false}
              onChange={field.onChange}
            />
          )}
        />
        {errors.fundId && (
          <p className="text-sm text-destructive">{errors.fundId.message}</p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="amount">Valor mensal</Label>
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
            <p className="text-sm text-destructive">{errors.amount.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="startDate">Início</Label>
          <Input id="startDate" type="date" {...register("startDate")} />
          {errors.startDate && (
            <p className="text-sm text-destructive">{errors.startDate.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">Fim opcional</Label>
          <Input
            id="endDate"
            type="date"
            {...register("endDate")}
            defaultValue={defaultValues?.endDate ?? ""}
          />
          {errors.endDate && (
            <p className="text-sm text-destructive">{errors.endDate.message}</p>
          )}
        </div>
      </div>

      {defaultValues?.active !== undefined && (
        <div className="flex flex-row items-center gap-3 rounded-lg border p-3">
          <Controller
            name="active"
            control={control}
            render={({ field }) => (
              <Checkbox
                checked={field.value ?? false}
                onCheckedChange={field.onChange}
              />
            )}
          />

          <div>
            <Label>Compromisso ativo</Label>
            <p className="text-xs text-muted-foreground">
              Compromissos inativos não entram nos relatórios.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          placeholder="Ex: Sustento mensal"
          {...register("description")}
          defaultValue={defaultValues?.description ?? ""}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Salvando..." : submitLabel}
      </Button>
    </form>
  )
}