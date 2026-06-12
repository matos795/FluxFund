import { ListChecks } from "lucide-react"
import { useState } from "react"

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

export function ViewCreditCardStatementItemsDialog({
  statement,
}: ViewCreditCardStatementItemsDialogProps) {
  const [open, setOpen] = useState(false)

  const itemsQuery = useCreditCardStatementItems(statement.id, open)

  const items = itemsQuery.data ?? []

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
            Total: {formatCurrency(statement.totalAmount)} ·{" "}
            {statement.itemCount === 1
              ? "1 item"
              : `${statement.itemCount} itens`}
          </p>
        </div>

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