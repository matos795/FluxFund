import { zodResolver } from "@hookform/resolvers/zod"
import { CreditCard } from "lucide-react"
import { useEffect, useState } from "react"
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
import { useCreditCardPaymentCandidates } from "../hooks/use-credit-card-payment-candidates"
import { formatCurrency, formatDate } from "@/utils/formatters"

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

  useEffect(() => {
    if (!selectedPaymentAccountId) {
      return
    }

    const selectedAccount = accountsQuery.data?.content.find(
      (account) => account.id === selectedPaymentAccountId,
    )

    if (selectedAccount?.type === "CREDIT_CARD") {
      setValue("paymentAccountId", "", {
        shouldValidate: true,
      })
    }
  }, [accountsQuery.data?.content, selectedPaymentAccountId, setValue])

  const paymentCandidatesQuery = useCreditCardPaymentCandidates({
    statement,
    paymentAccountId: selectedPaymentAccountId,
  })

  const paymentCandidates = paymentCandidatesQuery.data ?? []
  const bestCandidate = paymentCandidates[0]
  const selectedPaymentTransactionId = useWatch({
    control,
    name: "paymentTransactionId",
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
            <Label>Transação OFX do pagamento da fatura</Label>

            <EntityCombobox
              value={selectedPaymentTransactionId ?? ""}
              options={paymentCandidates.map(({ transaction, score }, index) => {
                const amount = Math.abs(
                  transaction.settledAmount ?? transaction.expectedAmount ?? 0,
                )

                const description =
                  transaction.description?.trim() ||
                  transaction.rawDescription?.trim() ||
                  "Transação OFX"

                const isBest = index === 0 && score > 0

                return {
                  value: transaction.id,
                  label: `${isBest ? "Sugestão: " : ""}${description} · ${formatCurrency(amount)} · ${formatDate(transaction.settlementDate)}`,
                }
              })}
              placeholder={
                selectedPaymentAccountId
                  ? "Selecione a transação OFX do pagamento"
                  : "Selecione primeiro a conta de pagamento"
              }
              searchPlaceholder="Buscar transação..."
              emptyMessage={
                paymentCandidatesQuery.isFetching
                  ? "Buscando transações..."
                  : "Nenhuma transação OFX candidata encontrada."
              }
              allowClear
              onChange={(value) => {
                setValue("paymentTransactionId", value, {
                  shouldValidate: true,
                })

                const selectedCandidate = paymentCandidates.find(
                  ({ transaction }) => transaction.id === value,
                )

                if (selectedCandidate?.transaction.settlementDate) {
                  setValue("paymentDate", selectedCandidate.transaction.settlementDate, {
                    shouldValidate: true,
                  })
                }
              }}
            />

            {bestCandidate && !selectedPaymentTransactionId && (
              <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                <p className="font-medium">Sugestão encontrada</p>
                <p className="text-muted-foreground">
                  {bestCandidate.transaction.description?.trim() ||
                    bestCandidate.transaction.rawDescription?.trim() ||
                    "Transação OFX"}
                </p>
                <p className="text-muted-foreground">
                  Valor:{" "}
                  {formatCurrency(
                    Math.abs(
                      bestCandidate.transaction.settledAmount ??
                      bestCandidate.transaction.expectedAmount ??
                      0,
                    ),
                  )}{" "}
                  · Data: {formatDate(bestCandidate.transaction.settlementDate)}
                </p>

                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="mt-2"
                  onClick={() => {
                    setValue("paymentTransactionId", bestCandidate.transaction.id, {
                      shouldValidate: true,
                    })

                    if (bestCandidate.transaction.settlementDate) {
                      setValue("paymentDate", bestCandidate.transaction.settlementDate, {
                        shouldValidate: true,
                      })
                    }
                  }}
                >
                  Usar sugestão
                </Button>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Se você selecionar uma transação OFX, o backend deve vinculá-la à fatura e transformá-la em transferência para evitar duplicidade de despesa.
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
