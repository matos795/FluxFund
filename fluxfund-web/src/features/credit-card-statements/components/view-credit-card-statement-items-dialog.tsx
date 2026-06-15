import { AlertTriangle, CheckCircle2, ListChecks, RefreshCw } from "lucide-react"
import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/utils/formatters"
import type { CreditCardStatement } from "../credit-card-statement-types"
import { useCreditCardStatementItems } from "../hooks/use-credit-card-statement-items"
import { FinancialTransactionActions } from "@/features/financial-transactions/components/financial-transaction-actions"

type ViewCreditCardStatementItemsDialogProps = {
  statement: CreditCardStatement
}

function getStatusLabel(status: string) {
  if (status === "PENDING") return "Pendente"
  if (status === "SETTLED") return "Pago"
  if (status === "CANCELED") return "Cancelado"
  return status
}

function getTransactionAmount(item: {
  expectedAmount?: number | null
  settledAmount?: number | null
}) {
  return Math.abs(item.settledAmount ?? item.expectedAmount ?? 0)
}

function getAllocatedAmount(item: {
  allocations?: { amount?: number | null }[] | null
}) {
  return Math.abs(
    item.allocations?.reduce((total, allocation) => {
      return total + Math.abs(allocation.amount ?? 0)
    }, 0) ?? 0,
  )
}

type SummaryCardProps = {
  title: string
  value: string
  description?: string
  warning?: boolean
}

function SummaryCard({
  title,
  value,
  description,
  warning = false,
}: SummaryCardProps) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
      {description && (
        <p
          className={
            warning
              ? "mt-1 text-xs text-amber-600"
              : "mt-1 text-xs text-muted-foreground"
          }
        >
          {description}
        </p>
      )}
    </div>
  )
}

export function ViewCreditCardStatementItemsDialog({
  statement,
}: ViewCreditCardStatementItemsDialogProps) {
  const [open, setOpen] = useState(false)

  const itemsQuery = useCreditCardStatementItems(statement.id, open)

  const items = useMemo(() => itemsQuery.data ?? [], [itemsQuery.data])

  const summary = useMemo(() => {
    const totalAmount = items.reduce((total, item) => {
      return total + getTransactionAmount(item)
    }, 0)

    const classifiedItems = items.filter((item) => Boolean(item.category))
    const unclassifiedItems = items.filter((item) => !item.category)

    const classifiedAmount = classifiedItems.reduce((total, item) => {
      return total + getTransactionAmount(item)
    }, 0)

    const unclassifiedAmount = unclassifiedItems.reduce((total, item) => {
      return total + getTransactionAmount(item)
    }, 0)

    const allocatedAmount = items.reduce((total, item) => {
      return total + getAllocatedAmount(item)
    }, 0)

    const unallocatedItems = items.filter((item) => {
      const amount = getTransactionAmount(item)
      const allocated = getAllocatedAmount(item)

      return allocated + 0.01 < amount
    })

    const unallocatedAmount = items.reduce((total, item) => {
      const amount = getTransactionAmount(item)
      const allocated = getAllocatedAmount(item)

      return total + Math.max(amount - allocated, 0)
    }, 0)

    return {
      totalAmount,
      classifiedAmount,
      unclassifiedAmount,
      allocatedAmount,
      unallocatedAmount,
      itemCount: items.length,
      classifiedCount: classifiedItems.length,
      unclassifiedCount: unclassifiedItems.length,
      unallocatedCount: unallocatedItems.length,
    }
  }, [items])

  const hasReviewIssues =
    summary.unclassifiedCount > 0 || summary.unallocatedCount > 0

  const reviewStatusLabel = hasReviewIssues
    ? "Fatura precisa de revisão"
    : "Fatura revisada"

  const reviewStatusDescription = hasReviewIssues
    ? "Existem itens sem categoria ou sem alocação completa."
    : "Todos os itens estão classificados e alocados."

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <ListChecks className="mr-2 size-4" />
          Itens
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Itens da fatura</DialogTitle>
          <DialogDescription>
            Confira as despesas vinculadas à fatura {statement.name}.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border bg-muted/40 p-3 text-sm">
          <p className="font-medium">{statement.name}</p>
          <p className="text-muted-foreground">
            Cartão: {statement.creditCardAccount?.name ?? "-"}
          </p>
          <p className="text-muted-foreground">
            Total:{" "}
            {formatCurrency(items.length > 0 ? summary.totalAmount : statement.totalAmount)} ·{" "}
            {items.length > 0
              ? items.length === 1
                ? "1 item"
                : `${items.length} itens`
              : statement.itemCount === 1
                ? "1 item"
                : `${statement.itemCount} itens`}
          </p>
        </div>

        {!itemsQuery.isLoading && !itemsQuery.isError && items.length > 0 && (
          <>
            <div
              className={
                hasReviewIssues
                  ? "flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm"
                  : "flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm"
              }
            >
              {hasReviewIssues ? (
                <AlertTriangle className="mt-0.5 size-4 text-amber-600" />
              ) : (
                <CheckCircle2 className="mt-0.5 size-4 text-emerald-600" />
              )}

              <div>
                <p className="font-medium">{reviewStatusLabel}</p>
                <p className="text-muted-foreground">{reviewStatusDescription}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <SummaryCard
                title="Total da fatura"
                value={formatCurrency(summary.totalAmount)}
                description={`${summary.itemCount} itens`}
              />

              <SummaryCard
                title="Classificado"
                value={formatCurrency(summary.classifiedAmount)}
                description={`${summary.classifiedCount} itens com categoria`}
              />

              <SummaryCard
                title="A classificar"
                value={formatCurrency(summary.unclassifiedAmount)}
                description={`${summary.unclassifiedCount} itens sem categoria`}
                warning={summary.unclassifiedCount > 0}
              />

              <SummaryCard
                title="Alocado"
                value={formatCurrency(summary.allocatedAmount)}
                description="Valor já distribuído em fundos"
              />

              <SummaryCard
                title="A alocar"
                value={formatCurrency(summary.unallocatedAmount)}
                description={`${summary.unallocatedCount} itens incompletos`}
                warning={summary.unallocatedCount > 0}
              />
              
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={itemsQuery.isFetching}
                onClick={() => itemsQuery.refetch()}
              >
                <RefreshCw className="mr-2 size-4" />
                Atualizar itens
              </Button>
            </div>
          </>
        )}

        {itemsQuery.isLoading && (
          <p className="text-sm text-muted-foreground">Carregando itens...</p>
        )}

        {itemsQuery.isError && (
          <p className="text-sm text-destructive">
            Não foi possível carregar os itens da fatura.
          </p>
        )}

        {!itemsQuery.isLoading && !itemsQuery.isError && items.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Esta fatura ainda não possui itens.
          </p>
        )}

        {!itemsQuery.isLoading && !itemsQuery.isError && items.length > 0 && (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-[80px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {items.map((item) => {
                  const description =
                    item.description?.trim() ||
                    item.rawDescription?.trim() ||
                    "Item sem descrição"

                  const amount = Math.abs(
                    item.settledAmount ?? item.expectedAmount ?? 0,
                  )

                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        {formatDate(item.dueDate ?? item.settlementDate)}
                      </TableCell>

                      <TableCell>
                        <div className="font-medium">{description}</div>
                        {item.rawDescription &&
                          item.description &&
                          item.rawDescription !== item.description && (
                            <div className="text-xs text-muted-foreground">
                              Origem: {item.rawDescription}
                            </div>
                          )}
                      </TableCell>

                      <TableCell>
                        {item.category?.name ?? (
                          <Badge variant="outline">A classificar</Badge>
                        )}
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline">{getStatusLabel(item.status)}</Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        {formatCurrency(amount)}
                      </TableCell>

                      <TableCell className="text-right">
                        <FinancialTransactionActions transaction={item} />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}