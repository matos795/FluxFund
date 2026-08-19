import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"

import { EntityCombobox } from "@/components/form/entity-combobox"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAccounts } from "@/features/accounts/hooks/use-accounts"
import {
  creditCardStatementFormSchema,
  type CreditCardStatementFormData,
  type CreditCardStatementFormInput,
} from "../credit-card-statement-schema"
import { useCreateCreditCardStatement } from "../hooks/use-create-credit-card-statement"
import { buildCreditCardStatementName, getDefaultClosingDate, getDefaultDueDate } from "../credit-card-statement-date-utils"
import { AppDialogBody, AppDialogContent, AppDialogHeader } from "@/components/layout/app-dialog"
import { CalendarDays } from "lucide-react"
import { MonthYearPickerPopover } from "@/components/filters/month-year-picker-popover"

type CreateCreditCardStatementDialogProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function CreateCreditCardStatementDialog({
  open: controlledOpen,
  onOpenChange,
}: CreateCreditCardStatementDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen

  const createStatementMutation = useCreateCreditCardStatement()
  const accountsQuery = useAccounts({ page: 0, size: 200 })

  const creditCardAccounts =
    accountsQuery.data?.content.filter((account) => account.type === "CREDIT_CARD") ?? []

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { errors },
  } = useForm<
    CreditCardStatementFormInput,
    unknown,
    CreditCardStatementFormData
  >({
    resolver: zodResolver(creditCardStatementFormSchema),
    defaultValues: {
      creditCardAccountId: "",
      referenceMonth: "",
      name: "",
      closingDate: "",
      dueDate: "",
    },
  })

  const selectedCreditCardAccountId = useWatch({
    control,
    name: "creditCardAccountId",
  })

  const selectedReferenceMonth = useWatch({
    control,
    name: "referenceMonth",
  })

  const selectedCreditCardAccount = creditCardAccounts.find(
    (account) => account.id === selectedCreditCardAccountId,
  )

  const selectedCreditCardAccountName = selectedCreditCardAccount?.name


  function handleOpenChange(value: boolean) {
    if (!value) {
      reset()
    }

    if (onOpenChange) {
      onOpenChange(value)
      return
    }

    setInternalOpen(value)
  }

  function handleCreateStatement(data: CreditCardStatementFormData) {
    createStatementMutation.mutate(
      {
        creditCardAccountId: data.creditCardAccountId,
        name: data.name,
        closingDate: data.closingDate || null,
        dueDate: data.dueDate,
      },
      {
        onSuccess: () => {
          toast.success("Fatura criada com sucesso.")
          handleOpenChange(false)
        },
        onError: () => {
          toast.error("Não foi possível criar a fatura.")
        },
      },
    )
  }

  function handleApplySuggestion() {
    if (!selectedCreditCardAccountId) {
      toast.error("Selecione o cartão.")
      return
    }

    if (!selectedReferenceMonth) {
      toast.error("Selecione o mês da fatura.")
      return
    }

    const suggestedName = buildCreditCardStatementName({
      accountName: selectedCreditCardAccountName,
      referenceMonth: selectedReferenceMonth,
    })

    const suggestedClosingDate = getDefaultClosingDate(selectedReferenceMonth)
    const suggestedDueDate = getDefaultDueDate(selectedReferenceMonth)

    setValue("name", suggestedName, {
      shouldDirty: true,
      shouldValidate: true,
    })

    setValue("closingDate", suggestedClosingDate, {
      shouldDirty: true,
      shouldValidate: true,
    })

    setValue("dueDate", suggestedDueDate, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {controlledOpen === undefined && (
        <DialogTrigger asChild>
          <Button>Nova fatura</Button>
        </DialogTrigger>
      )}

      <AppDialogContent size="md">
        <AppDialogHeader
          icon={<CalendarDays className="size-4 text-muted-foreground" />}
          title="Nova fatura de cartão"
          description="Crie a fatura para agrupar os itens do cartão. Cada item será uma despesa classificável."
        />

        <AppDialogBody>
          <form onSubmit={handleSubmit(handleCreateStatement)} className="space-y-4">
            <div className="space-y-2">
              <Label>Cartão</Label>
              <EntityCombobox
                value={selectedCreditCardAccountId}
                options={creditCardAccounts.map((account) => ({
                  value: account.id,
                  label: account.bankName
                    ? `${account.name} · ${account.bankName}`
                    : account.name,
                }))}
                placeholder="Selecione o cartão"
                searchPlaceholder="Buscar cartão..."
                emptyMessage="Nenhuma conta do tipo cartão de crédito encontrada. Cadastre em Contas primeiro."
                allowClear={false}
                onChange={(value) =>
                  setValue("creditCardAccountId", value, {
                    shouldValidate: true,
                  })
                }
              />
              {errors.creditCardAccountId && (
                <p className="text-sm text-destructive">
                  {errors.creditCardAccountId.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="referenceMonth">Mês da fatura</Label>
              <Controller
                name="referenceMonth"
                control={control}
                render={({ field }) => (
                  <MonthYearPickerPopover
                    value={
                      field.value ?? ""
                    }
                    onChange={
                      field.onChange
                    }
                    placeholder="Selecionar mês da fatura"
                  />
                )}
              />
              <p className="text-xs text-muted-foreground">
                Use o mês de referência da fatura. O sistema pode sugerir nome, fechamento e vencimento.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              disabled={!selectedReferenceMonth || !selectedCreditCardAccountId}
              onClick={handleApplySuggestion}
            >
              Sugerir nome e datas
            </Button>

            <div className="space-y-2">
              <Label htmlFor="name">Nome da fatura</Label>
              <Input
                id="name"
                placeholder="Ex: Fatura Bradesco Junho/2026"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="closingDate">Fechamento</Label>
                <Input id="closingDate" type="date" {...register("closingDate")} />
                {errors.closingDate && (
                  <p className="text-sm text-destructive">
                    {errors.closingDate.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Vencimento</Label>
                <Input id="dueDate" type="date" {...register("dueDate")} />
                {errors.dueDate && (
                  <p className="text-sm text-destructive">
                    {errors.dueDate.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-4">
              <Button type="submit" disabled={createStatementMutation.isPending}>
                {createStatementMutation.isPending ? "Criando..." : "Criar fatura"}
              </Button>
            </div>
          </form>
        </AppDialogBody>
      </AppDialogContent>
    </Dialog>
  )
}
