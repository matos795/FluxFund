import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm, useWatch } from "react-hook-form"

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
import { Textarea } from "@/components/ui/textarea"

import {
  financialTransactionFormSchema,
  type FinancialTransactionFormData,
  type FinancialTransactionFormInput,
} from "@/features/financial-transactions/financial-transaction-schema"
import { financialTransactionTypeLabels } from "@/features/financial-transactions/financial-transaction-labels"

import { useEffect } from "react"
import { useAccountOptions } from "@/features/accounts/hooks/use-account-options"
import { EntityCombobox } from "@/components/form/entity-combobox"
import { CurrencyInput } from "@/components/form/currency-input"
import { CategoryComboboxWithCreate } from "@/features/categories/components/category-combobox-with-create"

type FinancialTransactionFormProps = {
  onSubmit: (data: FinancialTransactionFormData) => void
  isSubmitting?: boolean
  defaultValues?: Partial<FinancialTransactionFormInput>
  submitLabel?: string
  disableAccountField?: boolean
}

export function FinancialTransactionForm({
  onSubmit,
  isSubmitting = false,
  defaultValues,
  submitLabel = "Salvar transação",
  disableAccountField,
}: FinancialTransactionFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { errors },
  } = useForm<
    FinancialTransactionFormInput,
    unknown,
    FinancialTransactionFormData
  >({
    resolver: zodResolver(financialTransactionFormSchema),
    defaultValues: {
      accountId: defaultValues?.accountId ?? "",
      type: defaultValues?.type ?? "EXPENSE",
      categoryId: defaultValues?.categoryId ?? "",
      dueDate:
        defaultValues?.dueDate ?? new Date().toISOString().slice(0, 10),
      settlementDate: defaultValues?.settlementDate ?? "",
      expectedAmount: defaultValues?.expectedAmount ?? 0,
      settledAmount: defaultValues?.settledAmount ?? undefined,
      description: defaultValues?.description ?? "",
      documentNumber: defaultValues?.documentNumber ?? "",
    },
  })

  useEffect(() => {
    if (!defaultValues) {
      return
    }

    reset({
      accountId: defaultValues.accountId ?? "",
      type: defaultValues.type ?? "EXPENSE",
      categoryId: defaultValues.categoryId ?? "",
      dueDate: defaultValues.dueDate ?? "",
      settlementDate: defaultValues.settlementDate ?? "",
      expectedAmount: defaultValues.expectedAmount ?? 0,
      settledAmount: defaultValues.settledAmount ?? undefined,
      description: defaultValues.description ?? "",
      documentNumber: defaultValues.documentNumber ?? "",
    })
  }, [defaultValues, reset])

  const selectedType = useWatch({ control, name: "type" })
  const selectedAccountId = useWatch({ control, name: "accountId" })
  const selectedCategoryId = useWatch({ control, name: "categoryId" })

  const accountsQuery = useAccountOptions()

  const accounts = accountsQuery.data ?? []

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Conta</Label>
          <EntityCombobox
            value={selectedAccountId}
            disabled={disableAccountField}
            placeholder="Selecione a conta"
            searchPlaceholder="Buscar conta..."
            emptyMessage="Nenhuma conta encontrada."
            allowClear={false}
            options={accounts.map((account) => ({
              value: account.id,
              label: account.label,
            }))}
            onChange={(value) =>
              setValue("accountId", value, {
                shouldValidate: true,
              })
            }
          />

          {errors.accountId && (
            <p className="text-sm text-destructive">
              {errors.accountId.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select
            value={selectedType}
            onValueChange={(value) => {
              setValue(
                "type",
                value as FinancialTransactionFormInput["type"],
                {
                  shouldValidate: true,
                },
              )

              setValue("categoryId", "", {
                shouldValidate: true,
              })
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>

            <SelectContent>
              {Object.entries(financialTransactionTypeLabels).map(
                ([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>

          {errors.type && (
            <p className="text-sm text-destructive">{errors.type.message}</p>
          )}
        </div>
      </div>

      {selectedType !== "TRANSFER" && (
        <div className="space-y-2">
          <Label>Categoria</Label>
          <CategoryComboboxWithCreate
            value={selectedCategoryId ?? ""}
            type={selectedType}
            placeholder="Selecione a categoria"
            searchPlaceholder="Buscar categoria..."
            emptyMessage="Nenhuma categoria encontrada."
            allowClear={false}
            disabled={false}
            onChange={(value) => {
              setValue("categoryId", value, {
                shouldValidate: true,
              })
            }}
          />

          {errors.categoryId && (
            <p className="text-sm text-destructive">
              {errors.categoryId.message}
            </p>
          )}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="dueDate">Data de vencimento</Label>
          <Input id="dueDate" type="date" {...register("dueDate")} />
          {errors.dueDate && (
            <p className="text-sm text-destructive">
              {errors.dueDate.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="settlementDate">Data de baixa</Label>
          <Input
            id="settlementDate"
            type="date"
            {...register("settlementDate")}
          />
          {errors.settlementDate && (
            <p className="text-sm text-destructive">
              {errors.settlementDate.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="expectedAmount">Valor previsto</Label>
          <Controller
            name="expectedAmount"
            control={control}
            render={({ field }) => (
              <CurrencyInput
                id="expectedAmount"
                value={field.value as number | null | undefined}
                onValueChange={field.onChange}
              />
            )}
          />
          {errors.expectedAmount && (
            <p className="text-sm text-destructive">
              {errors.expectedAmount.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="settledAmount">Valor baixado</Label>
          <Controller
            name="settledAmount"
            control={control}
            render={({ field }) => (
              <CurrencyInput
                id="settledAmount"
                value={field.value as number | null | undefined}
                allowEmpty
                onValueChange={field.onChange}
              />
            )}
          />
          {errors.settledAmount && (
            <p className="text-sm text-destructive">
              {errors.settledAmount.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição interna</Label>
        <Textarea
          id="description"
          placeholder="Descrição opcional para uso interno..."
          {...register("description")}
        />
        {errors.description && (
          <p className="text-sm text-destructive">
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="documentNumber">Número do documento</Label>
        <Input
          id="documentNumber"
          placeholder="Ex: NF-123, REC-456, DOC-789"
          {...register("documentNumber")}
        />
        {errors.documentNumber && (
          <p className="text-sm text-destructive">
            {errors.documentNumber.message}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="submit"
          disabled={isSubmitting || accountsQuery.isLoading}
        >
          {isSubmitting ? "Salvando..." : submitLabel}
        </Button>
      </div>
    </form>
  )
}