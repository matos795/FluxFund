import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowRightLeft } from "lucide-react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"

import { EntityCombobox } from "@/components/form/entity-combobox"
import { CurrencyInput } from "@/components/form/currency-input"
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
import { Textarea } from "@/components/ui/textarea"
import { useAccounts } from "@/features/accounts/hooks/use-accounts"
import { getApiErrorMessage } from "@/utils/api-error"
import {
  accountTransferFormSchema,
  type AccountTransferFormData,
  type AccountTransferFormInput,
} from "../account-transfer-schema"
import { useCreateAccountTransfer } from "../hooks/use-create-account-transfer"

type CreateAccountTransferDialogProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function CreateAccountTransferDialog({
  open,
  onOpenChange,
}: CreateAccountTransferDialogProps) {
  const accountsQuery = useAccounts({ page: 0, size: 200 })
  const createAccountTransferMutation = useCreateAccountTransfer()

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AccountTransferFormInput, unknown, AccountTransferFormData>({
    resolver: zodResolver(accountTransferFormSchema),
    defaultValues: {
      sourceAccountId: "",
      destinationAccountId: "",
      transferDate: new Date().toISOString().slice(0, 10),
      amount: 0,
      description: "",
    },
  })

  const selectedSourceAccountId = useWatch({
    control,
    name: "sourceAccountId",
  })

  const accounts =
    accountsQuery.data?.content.filter(
      (account) => account.active && account.type !== "CREDIT_CARD",
    ) ?? []

  const sourceAccountOptions = accounts.map((account) => ({
    value: account.id,
    label: account.bankName
      ? `${account.name} · ${account.bankName}`
      : account.name,
  }))

  const destinationAccountOptions = accounts
    .filter((account) => account.id !== selectedSourceAccountId)
    .map((account) => ({
      value: account.id,
      label: account.bankName
        ? `${account.name} · ${account.bankName}`
        : account.name,
    }))

  function handleOpenChange(value: boolean) {
    if (!value) {
      reset()
    }

    onOpenChange?.(value)
  }

  function handleCreateTransfer(data: AccountTransferFormData) {
    createAccountTransferMutation.mutate(
      {
        sourceAccountId: data.sourceAccountId,
        destinationAccountId: data.destinationAccountId,
        transferDate: data.transferDate,
        amount: data.amount,
        description: data.description?.trim() || null,
      },
      {
        onSuccess: () => {
          toast.success("Transferência entre contas criada com sucesso.")
          handleOpenChange(false)
        },
        onError: (error) => {
          toast.error(
            getApiErrorMessage(
              error,
              "Não foi possível criar a transferência entre contas.",
            ),
          )
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          <ArrowRightLeft className="mr-2 size-4" />
          Nova transferência
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nova transferência entre contas</DialogTitle>
          <DialogDescription>
            Registre uma movimentação real entre duas contas. O sistema criará
            uma saída na origem e uma entrada no destino, sem gerar receita ou
            despesa nos relatórios.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={handleSubmit(handleCreateTransfer)}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Controller
              control={control}
              name="sourceAccountId"
              render={({ field }) => (
                <div className="space-y-2">
                  <Label>Conta origem</Label>
                  <EntityCombobox
                    value={field.value ?? ""}
                    options={sourceAccountOptions}
                    placeholder="Selecione a origem"
                    searchPlaceholder="Buscar conta..."
                    emptyMessage="Nenhuma conta encontrada."
                    allowClear={false}
                    onChange={field.onChange}
                  />
                  {errors.sourceAccountId && (
                    <p className="text-sm text-destructive">
                      {errors.sourceAccountId.message}
                    </p>
                  )}
                </div>
              )}
            />

            <Controller
              control={control}
              name="destinationAccountId"
              render={({ field }) => (
                <div className="space-y-2">
                  <Label>Conta destino</Label>
                  <EntityCombobox
                    value={field.value ?? ""}
                    options={destinationAccountOptions}
                    placeholder="Selecione o destino"
                    searchPlaceholder="Buscar conta..."
                    emptyMessage="Nenhuma conta encontrada."
                    allowClear={false}
                    disabled={!selectedSourceAccountId}
                    onChange={field.onChange}
                  />
                  {errors.destinationAccountId && (
                    <p className="text-sm text-destructive">
                      {errors.destinationAccountId.message}
                    </p>
                  )}
                </div>
              )}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="transferDate">Data da transferência</Label>
              <Input
                id="transferDate"
                type="date"
                {...register("transferDate")}
              />
              {errors.transferDate && (
                <p className="text-sm text-destructive">
                  {errors.transferDate.message}
                </p>
              )}
            </div>

            <Controller
              control={control}
              name="amount"
              render={({ field }) => (
                <div className="space-y-2">
                  <Label htmlFor="amount">Valor</Label>
                  <CurrencyInput
                    id="amount"
                    value={field.value as number | null | undefined}
                    onValueChange={field.onChange}
                  />
                  {errors.amount && (
                    <p className="text-sm text-destructive">
                      {errors.amount.message}
                    </p>
                  )}
                </div>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Ex: Transferência Bradesco para Sicredi"
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
            Essa transferência não terá categoria nem alocação, porque não é
            receita nem despesa. Ela representa apenas dinheiro saindo de uma
            conta e entrando em outra.
          </div>

          <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              disabled={createAccountTransferMutation.isPending}
              onClick={() => handleOpenChange(false)}
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={createAccountTransferMutation.isPending}
            >
              {createAccountTransferMutation.isPending
                ? "Criando..."
                : "Criar transferência"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}