import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"

import { EntityCombobox } from "@/components/form/entity-combobox"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
      name: "",
      closingDate: "",
      dueDate: new Date().toISOString().slice(0, 10),
    },
  })

  const selectedCreditCardAccountId = useWatch({
    control,
    name: "creditCardAccountId",
  })

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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {controlledOpen === undefined && (
        <DialogTrigger asChild>
          <Button>Nova fatura</Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nova fatura de cartão</DialogTitle>
          <DialogDescription>
            Crie a fatura para agrupar os itens do cartão. Cada item será uma despesa classificável.
          </DialogDescription>
        </DialogHeader>

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
      </DialogContent>
    </Dialog>
  )
}
