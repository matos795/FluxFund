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
import { Textarea } from "@/components/ui/textarea"

import {
  financialTransactionFormSchema,
  type FinancialTransactionFormData,
  type FinancialTransactionFormInput,
} from "@/features/financial-transactions/financial-transaction-schema"
import { financialTransactionTypeLabels } from "@/features/financial-transactions/financial-transaction-labels"

import { useAccounts } from "@/features/accounts/hooks/use-accounts"
import { useCategories } from "@/features/categories/hooks/use-categories"
import type { CategorySummary } from "@/features/categories/category-types"
import { useEffect } from "react"

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

  const accountsQuery = useAccounts({
    page: 0,
    size: 100,
  })

  const categoriesQuery = useCategories({
    page: 0,
    size: 100,
  })

  const accounts = accountsQuery.data?.content ?? []

  const categories =
    categoriesQuery.data?.content.filter((category) => {
      if (selectedType === "TRANSFER") {
        return false
      }

      return category.type === selectedType
    }) ?? []

  function formatCategoryLabel(category: {
    name: string
    parent?: CategorySummary | null
  }) {
    if (category.parent) {
      return `${category.name} -> ${category.parent.name}`
    }

    return category.name
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Conta</Label>
          <Select
            value={selectedAccountId}
            disabled={disableAccountField}
            onValueChange={(value) =>
              setValue("accountId", value, {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a conta" />
            </SelectTrigger>

            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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
          <Select
            value={selectedCategoryId}
            onValueChange={(value) =>
              setValue("categoryId", value, {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a categoria" />
            </SelectTrigger>

            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {formatCategoryLabel(category)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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
          <Input
            id="expectedAmount"
            type="number"
            step="0.01"
            min="0"
            {...register("expectedAmount")}
          />
          {errors.expectedAmount && (
            <p className="text-sm text-destructive">
              {errors.expectedAmount.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="settledAmount">Valor baixado</Label>
          <Input
            id="settledAmount"
            type="number"
            step="0.01"
            min="0"
            {...register("settledAmount")}
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
          disabled={
            isSubmitting ||
            accountsQuery.isLoading ||
            categoriesQuery.isLoading
          }
        >
          {isSubmitting ? "Salvando..." : submitLabel}
        </Button>
      </div>
    </form>
  )
}