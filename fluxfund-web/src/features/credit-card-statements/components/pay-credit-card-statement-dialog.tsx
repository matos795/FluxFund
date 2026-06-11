import { zodResolver } from "@hookform/resolvers/zod"
import { CreditCard } from "lucide-react"
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
import type { CreditCardStatement } from "../credit-card-statement-types"
import {
  payCreditCardStatementFormSchema,
  type PayCreditCardStatementFormData,
  type PayCreditCardStatementFormInput,
} from "../credit-card-statement-schema"
import { usePayCreditCardStatement } from "../hooks/use-pay-credit-card-statement"

type PayCreditCardStatementDialogProps = {
  statement: CreditCardStatement
}

export function PayCreditCardStatementDialog({
  statement,
}: PayCreditCardStatementDialogProps) {
  const [open, setOpen] = useState(false)
  const payStatementMutation = usePayCreditCardStatement()
  const accountsQuery = useAccounts({ page: 0, size: 200 })

  const paymentAccounts =
    accountsQuery.data?.content.filter((account) => account.type !== "CREDIT_CARD") ?? []

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { errors },
  } = useForm<
    PayCreditCardStatementFormInput,
    unknown,
    PayCreditCardStatementFormData
  >({
    resolver: zodResolver(payCreditCardStatementFormSchema),
    defaultValues: {
      paymentAccountId: "",
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentTransactionId: "",
    },
  })

  const selectedPaymentAccountId = useWatch({
    control,
    name: "paymentAccountId",
  })

  function handleOpenChange(value: boolean) {
    if (!value) {
      reset()
    }

    setOpen(value)
  }

  function handlePayStatement(data: PayCreditCardStatementFormData) {
    payStatementMutation.mutate(
      {
        statementId: statement.id,
        data: {
          paymentAccountId: data.paymentAccountId,
          paymentDate: data.paymentDate,
          paymentTransactionId: data.paymentTransactionId || null,
        },
      },
      {
        onSuccess: () => {
          toast.success("Fatura marcada como paga.")
          handleOpenChange(false)
        },
        onError: () => {
          toast.error("Não foi possível marcar a fatura como paga.")
        },
      },
    )
  }

  const canPay = statement.status !== "PAID" && statement.status !== "CANCELED"

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" disabled={!canPay}>
          <CreditCard className="mr-2 size-4" />
          Pagar
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Pagar fatura</DialogTitle>
          <DialogDescription>
            Marque a fatura como paga e informe a conta bancária que quitou o cartão. O pagamento da fatura não deve ser classificado como despesa para evitar duplicidade.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handlePayStatement)} className="space-y-4">
          <div className="space-y-2 rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
            <p>
              Depois disso, os itens do cartão continuam sendo as despesas reais. A saída bancária da fatura deve ser tratada como transferência/pagamento de cartão.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Conta de pagamento</Label>
            <EntityCombobox
              value={selectedPaymentAccountId}
              options={paymentAccounts.map((account) => ({
                value: account.id,
                label: account.bankName
                  ? `${account.name} · ${account.bankName}`
                  : account.name,
              }))}
              placeholder="Selecione a conta que pagou a fatura"
              searchPlaceholder="Buscar conta..."
              emptyMessage="Nenhuma conta de pagamento encontrada."
              allowClear={false}
              onChange={(value) =>
                setValue("paymentAccountId", value, {
                  shouldValidate: true,
                })
              }
            />
            {errors.paymentAccountId && (
              <p className="text-sm text-destructive">
                {errors.paymentAccountId.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentDate">Data de pagamento</Label>
            <Input id="paymentDate" type="date" {...register("paymentDate")} />
            {errors.paymentDate && (
              <p className="text-sm text-destructive">
                {errors.paymentDate.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentTransactionId">
              ID da transação OFX de pagamento da fatura
            </Label>
            <Input
              id="paymentTransactionId"
              placeholder="Opcional: cole o ID da transação bancária de pagamento"
              {...register("paymentTransactionId")}
            />
            <p className="text-xs text-muted-foreground">
              Campo opcional. Por enquanto, você pode deixar vazio e tratar a transação bancária pela tela de transações.
            </p>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              disabled={payStatementMutation.isPending}
              onClick={() => handleOpenChange(false)}
            >
              Cancelar
            </Button>

            <Button type="submit" disabled={payStatementMutation.isPending}>
              {payStatementMutation.isPending ? "Salvando..." : "Marcar como paga"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
