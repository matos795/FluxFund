import { Link2 } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import { EntityCombobox } from "@/components/form/entity-combobox"
import {
  AppDialogBody,
  AppDialogContent,
  AppDialogFooter,
  AppDialogHeader,
} from "@/components/layout/app-dialog"
import { Button } from "@/components/ui/button"
import { Dialog, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import type { FinancialTransaction } from "@/features/financial-transactions/financial-transaction-types"
import { getApiErrorMessage } from "@/utils/api-error"
import { formatCurrency, formatDate } from "@/utils/formatters"
import { useCreditCardStatementPayments } from "../hooks/use-credit-card-statement-payments"
import { useCreditCardStatements } from "../hooks/use-credit-card-statements"
import { useLinkCreditCardStatementPayment } from "../hooks/use-link-credit-card-statement-payment"
import { usePayCreditCardStatement } from "../hooks/use-pay-credit-card-statement"

type LinkCreditCardPaymentDialogProps = {
  transaction: FinancialTransaction
}

function getTransactionAmount(transaction: FinancialTransaction) {
  return Math.abs(
    transaction.settledAmount ?? transaction.expectedAmount ?? 0,
  )
}

function addDays(date: string, days: number) {
  const parsedDate = new Date(`${date}T00:00:00`)
  parsedDate.setDate(parsedDate.getDate() + days)
  return parsedDate.toISOString().slice(0, 10)
}

function isNearDate(referenceDate: string, transactionDate: string | null) {
  if (!transactionDate) return true

  return (
    transactionDate >= addDays(referenceDate, -15) &&
    transactionDate <= addDays(referenceDate, 15)
  )
}

export function LinkCreditCardPaymentDialog({
  transaction,
}: LinkCreditCardPaymentDialogProps) {
  const [open, setOpen] = useState(false)
  const [statementId, setStatementId] = useState("")

  const statementsQuery = useCreditCardStatements({
    page: 0,
    size: 100,
  })
  const paymentsQuery = useCreditCardStatementPayments(
    statementId,
    open && Boolean(statementId),
  )

  const payStatementMutation = usePayCreditCardStatement()
  const linkPaymentMutation = useLinkCreditCardStatementPayment()

  const transactionAmount = getTransactionAmount(transaction)

  const availableStatements = useMemo(() => {
    const statements = statementsQuery.data?.content ?? []

    return statements
      .filter(
        (statement) =>
          statement.status !== "PAID" &&
          statement.status !== "CANCELED" &&
          (statement.unlinkedPaymentCount > 0 ||
            transactionAmount <= statement.outstandingAmount),
      )
      .map((statement) => {
        let score = 0

        if (
          Math.abs(statement.outstandingAmount - transactionAmount) < 0.01
        ) {
          score += 100
        }

        if (statement.unlinkedPaymentCount > 0) {
          score += 30
        }

        if (
          transaction.settlementDate &&
          isNearDate(statement.dueDate, transaction.settlementDate)
        ) {
          score += 40
        }

        return {
          statement,
          score,
        }
      })
      .sort((a, b) => b.score - a.score)
  }, [
    statementsQuery.data?.content,
    transactionAmount,
    transaction.settlementDate,
  ])

  const selectedStatement = availableStatements.find(
    (item) => item.statement.id === statementId,
  )?.statement

  const matchingUnlinkedPayments = useMemo(() => {
    const payments = paymentsQuery.data ?? []

    return payments.filter(
      (payment) =>
        !payment.linked &&
        Math.abs(payment.amount - transactionAmount) < 0.01 &&
        isNearDate(payment.paymentDate, transaction.settlementDate),
    )
  }, [paymentsQuery.data, transactionAmount, transaction.settlementDate])

  const bestSuggestion = availableStatements[0]
  const pending =
    payStatementMutation.isPending || linkPaymentMutation.isPending

  function resetDialog() {
    setStatementId("")
  }

  function handleOpenChange(value: boolean) {
    if (!value) {
      resetDialog()
    }

    setOpen(value)
  }

  function handleLink() {
    if (!selectedStatement) {
      toast.error("Selecione uma fatura.")
      return
    }

    if (paymentsQuery.isLoading || paymentsQuery.isFetching) {
      toast.error("Aguarde a conferência dos pagamentos da fatura.")
      return
    }

    if (paymentsQuery.isError) {
      toast.error("Não foi possível conferir os pagamentos da fatura.")
      return
    }

    if (matchingUnlinkedPayments.length > 1) {
      toast.error(
        "Há mais de um pagamento pendente com esse valor. Faça o vínculo em Faturas > Ver pagamentos.",
      )
      return
    }

    if (
      selectedStatement.unlinkedPaymentCount > 0 &&
      matchingUnlinkedPayments.length === 0
    ) {
      toast.error(
        "A fatura possui pagamentos aguardando vínculo, mas nenhum corresponde a esta saída. Faça a conciliação em Faturas > Ver pagamentos.",
      )
      return
    }

    const existingPayment = matchingUnlinkedPayments[0]

    if (existingPayment) {
      linkPaymentMutation.mutate(
        {
          statementId: selectedStatement.id,
          paymentId: existingPayment.id,
          data: {
            paymentAccountId: transaction.account.id,
            paymentTransactionId: transaction.id,
          },
        },
        {
          onSuccess: () => {
            toast.success(
              "Pagamento detectado na fatura conciliado com a saída bancária.",
            )
            handleOpenChange(false)
          },
          onError: (error) => {
            toast.error(
              getApiErrorMessage(
                error,
                "Não foi possível conciliar o pagamento.",
              ),
            )
          },
        },
      )
      return
    }

    const paymentDate =
      transaction.settlementDate ??
      transaction.dueDate ??
      new Date().toISOString().slice(0, 10)

    payStatementMutation.mutate(
      {
        statementId: selectedStatement.id,
        data: {
          paymentAccountId: transaction.account.id,
          paymentDate,
          amount: transactionAmount,
          paymentTransactionId: transaction.id,
        },
      },
      {
        onSuccess: () => {
          toast.success("Novo pagamento registrado e vinculado à fatura.")
          handleOpenChange(false)
        },
        onError: (error) => {
          toast.error(
            getApiErrorMessage(
              error,
              "Não foi possível vincular o pagamento à fatura.",
            ),
          )
        },
      },
    )
  }

  const description =
    transaction.description?.trim() ||
    transaction.rawDescription?.trim() ||
    "Transação OFX"

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Link2 className="mr-2 size-4" />
          Vincular fatura
        </Button>
      </DialogTrigger>

      <AppDialogContent size="lg">
        <AppDialogHeader
          icon={<Link2 className="size-4 text-muted-foreground" />}
          title="Vincular pagamento de fatura"
          description="O FluxFund procura primeiro um pagamento detectado no OFX do cartão. Quando encontra, apenas concilia a saída bancária, sem duplicar o valor pago."
        />

        <AppDialogBody className="space-y-4">
          <div className="rounded-lg border bg-muted/40 p-3 text-sm">
            <p className="font-medium">{description}</p>
            <p className="text-muted-foreground">
              Conta: {transaction.account.name}
            </p>
            <p className="text-muted-foreground">
              Valor: {formatCurrency(transactionAmount)} · Data:{" "}
              {formatDate(transaction.settlementDate)}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Fatura</Label>
            <EntityCombobox
              value={statementId}
              options={availableStatements.map(
                ({ statement, score }, index) => ({
                  value: statement.id,
                  label: `${
                    index === 0 && score > 0 ? "Sugestão: " : ""
                  }${statement.name} · restante ${formatCurrency(
                    statement.outstandingAmount,
                  )}${
                    statement.unlinkedPaymentCount > 0
                      ? ` · ${statement.unlinkedPaymentCount} vínculo(s) pendente(s)`
                      : ""
                  } · vence ${formatDate(statement.dueDate)}`,
                }),
              )}
              placeholder="Selecione a fatura paga por esta transação"
              searchPlaceholder="Buscar fatura..."
              emptyMessage="Nenhuma fatura candidata encontrada."
              allowClear
              onChange={setStatementId}
            />
          </div>

          {statementId && paymentsQuery.isLoading && (
            <p className="text-sm text-muted-foreground">
              Conferindo pagamentos detectados na fatura...
            </p>
          )}

          {matchingUnlinkedPayments.length === 1 && (
            <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900">
              Foi encontrado um pagamento detectado na fatura de{" "}
              <strong>{formatCurrency(matchingUnlinkedPayments[0].amount)}</strong>{" "}
              em {formatDate(matchingUnlinkedPayments[0].paymentDate)}. A ação
              apenas conciliará essa saída bancária.
            </div>
          )}

          {selectedStatement &&
            selectedStatement.unlinkedPaymentCount > 0 &&
            !paymentsQuery.isLoading &&
            matchingUnlinkedPayments.length === 0 && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                Esta fatura possui pagamentos aguardando vínculo, mas nenhum
                deles corresponde ao valor desta saída. Faça a conferência em
                <strong> Faturas &gt; Ver pagamentos</strong>.
              </div>
            )}

          {bestSuggestion && !statementId && bestSuggestion.score > 0 && (
            <div className="rounded-lg border bg-muted/40 p-3 text-sm">
              <p className="font-medium">Sugestão encontrada</p>
              <p className="text-muted-foreground">
                {bestSuggestion.statement.name} · Restante:{" "}
                {formatCurrency(bestSuggestion.statement.outstandingAmount)} ·
                vence {formatDate(bestSuggestion.statement.dueDate)}
              </p>

              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="mt-2"
                onClick={() => setStatementId(bestSuggestion.statement.id)}
              >
                Usar sugestão
              </Button>
            </div>
          )}
        </AppDialogBody>

        <AppDialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => handleOpenChange(false)}
          >
            Cancelar
          </Button>

          <Button
            type="button"
            disabled={
              pending ||
              !statementId ||
              paymentsQuery.isLoading ||
              paymentsQuery.isError ||
              matchingUnlinkedPayments.length > 1 ||
              Boolean(
                selectedStatement &&
                  selectedStatement.unlinkedPaymentCount > 0 &&
                  matchingUnlinkedPayments.length === 0,
              )
            }
            onClick={handleLink}
          >
            {pending
              ? "Vinculando..."
              : matchingUnlinkedPayments.length === 1
                ? "Conciliar pagamento existente"
                : "Registrar e vincular pagamento"}
          </Button>
        </AppDialogFooter>
      </AppDialogContent>
    </Dialog>
  )
}
