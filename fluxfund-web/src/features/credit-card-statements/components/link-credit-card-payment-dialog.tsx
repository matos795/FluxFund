import { Link2 } from "lucide-react"
import { useMemo, useState } from "react"
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
import { Label } from "@/components/ui/label"
import type { FinancialTransaction } from "@/features/financial-transactions/financial-transaction-types"
import { formatCurrency, formatDate } from "@/utils/formatters"
import { useCreditCardStatements } from "../hooks/use-credit-card-statements"
import { usePayCreditCardStatement } from "../hooks/use-pay-credit-card-statement"
import { getApiErrorMessage } from "@/utils/api-error"

type LinkCreditCardPaymentDialogProps = {
  transaction: FinancialTransaction
}

function getTransactionAmount(transaction: FinancialTransaction) {
  return Math.abs(transaction.settledAmount ?? transaction.expectedAmount ?? 0)
}

function addDays(date: string, days: number) {
  const parsedDate = new Date(`${date}T00:00:00`)
  parsedDate.setDate(parsedDate.getDate() + days)
  return parsedDate.toISOString().slice(0, 10)
}

function isNearDate(statementDueDate: string, transactionDate: string | null) {
  if (!transactionDate) return false

  return (
    transactionDate >= addDays(statementDueDate, -15) &&
    transactionDate <= addDays(statementDueDate, 15)
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

  const payStatementMutation = usePayCreditCardStatement()

  const transactionAmount = getTransactionAmount(transaction)

  const availableStatements = useMemo(() => {
    const statements = statementsQuery.data?.content ?? []

    return statements
      .filter(
        (statement) =>
          statement.status !== "PAID" &&
          statement.status !== "CANCELED" &&
          statement.totalAmount > 0,
      )
      .map((statement) => {
        let score = 0

        if (Math.abs(statement.totalAmount - transactionAmount) < 0.01) {
          score += 100
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
  }, [statementsQuery.data?.content, transactionAmount, transaction.settlementDate])

  const bestSuggestion = availableStatements[0]

  function handleLink() {
    const selectedStatement = availableStatements.find(
      (item) => item.statement.id === statementId,
    )?.statement

    if (!selectedStatement) {
      toast.error("Selecione uma fatura.")
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
          paymentTransactionId: transaction.id,
        },
      },
      {
        onSuccess: () => {
          toast.success("Pagamento vinculado à fatura.")
          setOpen(false)
          setStatementId("")
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Link2 className="mr-2 size-4" />
          Vincular fatura
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Vincular pagamento à fatura</DialogTitle>
          <DialogDescription>
            Use esta ação quando uma transação OFX representa o pagamento de uma fatura de cartão. O backend deve transformar essa transação em transferência para não duplicar a despesa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
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
              options={availableStatements.map(({ statement, score }, index) => ({
                value: statement.id,
                label: `${index === 0 && score > 0 ? "Sugestão: " : ""}${statement.name} · ${formatCurrency(statement.totalAmount)} · vence ${formatDate(statement.dueDate)}`,
              }))}
              placeholder="Selecione a fatura paga por esta transação"
              searchPlaceholder="Buscar fatura..."
              emptyMessage="Nenhuma fatura candidata encontrada."
              allowClear
              onChange={setStatementId}
            />
          </div>

          {bestSuggestion && !statementId && bestSuggestion.score > 0 && (
            <div className="rounded-lg border bg-muted/40 p-3 text-sm">
              <p className="font-medium">Sugestão encontrada</p>
              <p className="text-muted-foreground">
                {bestSuggestion.statement.name} ·{" "}
                {formatCurrency(bestSuggestion.statement.totalAmount)} · vence{" "}
                {formatDate(bestSuggestion.statement.dueDate)}
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

          <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              disabled={payStatementMutation.isPending}
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>

            <Button
              type="button"
              disabled={payStatementMutation.isPending}
              onClick={handleLink}
            >
              {payStatementMutation.isPending
                ? "Vinculando..."
                : "Vincular pagamento"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}