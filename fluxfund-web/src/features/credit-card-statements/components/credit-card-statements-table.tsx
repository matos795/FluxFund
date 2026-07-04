import { CreditCard, FileText, FileUp, ListChecks, MoreHorizontal, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { usePermissions } from "@/features/auth/hooks/use-permissions"
import { formatCurrency, formatDate } from "@/utils/formatters"
import { creditCardStatementStatusLabels } from "../credit-card-statement-labels"
import type { CreditCardStatement } from "../credit-card-statement-types"
import { useCancelCreditCardStatement } from "../hooks/use-cancel-credit-card-statement"
import { AddCreditCardStatementItemDialog } from "./add-credit-card-statement-item-dialog"
import { PayCreditCardStatementDialog } from "./pay-credit-card-statement-dialog"
import { ViewCreditCardStatementItemsDialog } from "./view-credit-card-statement-items-dialog"
import { ImportCreditCardStatementDialog } from "./import-credit-card-statement-dialog"
import { ConfirmActionDialog } from "@/components/layout/confirm-action-dialog"
import { CreditCardStatementDocumentDialog } from "./credit-card-statement-document-dialog"
import { ExportCreditCardStatementReportButton } from "@/features/credit-card-statements/components/export-credit-card-statement-report-button"

type CreditCardStatementsTableProps = {
  statements: CreditCardStatement[]
}

function getStatusBadgeVariant(status: CreditCardStatement["status"]) {
  if (status === "PAID") {
    return "default"
  }

  if (status === "CANCELED") {
    return "destructive"
  }

  if (status === "CLOSED") {
    return "secondary"
  }

  return "outline"
}

export function CreditCardStatementsTable({
  statements,
}: CreditCardStatementsTableProps) {
  const { canFinanceWrite } = usePermissions()
  const [statementToCancel, setStatementToCancel] =
    useState<CreditCardStatement | null>(null)
  const [statementToImport, setStatementToImport] =
    useState<CreditCardStatement | null>(null)

  const [statementToAddItem, setStatementToAddItem] =
    useState<CreditCardStatement | null>(null)

  const [statementToPay, setStatementToPay] =
    useState<CreditCardStatement | null>(null)

  const [statementToManageDocument, setStatementToManageDocument] =
    useState<CreditCardStatement | null>(null)

  const [statementToViewItems, setStatementToViewItems] =
    useState<CreditCardStatement | null>(null)

  const cancelStatementMutation = useCancelCreditCardStatement()

  function handleCancelStatement() {
    if (!statementToCancel) {
      return
    }

    cancelStatementMutation.mutate(statementToCancel.id, {
      onSuccess: () => {
        toast.success("Fatura cancelada com sucesso.")
        setStatementToCancel(null)
      },
      onError: () => {
        toast.error("Não foi possível cancelar a fatura.")
      },
    })
  }

  if (statements.length === 0) {
    return (
      <Card>
        <CardContent className="flex min-h-44 flex-col items-center justify-center gap-2 text-center">
          <p className="font-medium">Nenhuma fatura cadastrada.</p>
          <p className="max-w-xl text-sm text-muted-foreground">
            Crie uma fatura para agrupar os itens do cartão. Os itens serão lançados como despesas individuais para poderem receber categoria, alocação e anexos.
          </p>
        </CardContent>
      </Card>
    )
  }

  function canImportStatement(statement: CreditCardStatement) {
    return statement.status === "OPEN" || statement.status === "CLOSED"
  }

  function canAddItemToStatement(statement: CreditCardStatement) {
    return statement.status === "OPEN" || statement.status === "CLOSED"
  }

  function canPayStatement(statement: CreditCardStatement) {
    return statement.status !== "PAID" && statement.status !== "CANCELED"
  }

  function canCancelStatement(statement: CreditCardStatement) {
    return statement.status !== "PAID" && statement.status !== "CANCELED"
  }

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fatura</TableHead>
                <TableHead>Cartão</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead>Fechamento</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[72px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {statements.map((statement) => (
                <TableRow key={statement.id}>
                  <TableCell>
                    <div className="font-medium">{statement.name}</div>
                    {statement.paymentAccount && (
                      <div className="text-xs text-muted-foreground">
                        Pago por {statement.paymentAccount.name}
                      </div>
                    )}
                  </TableCell>

                  <TableCell>
                    <div>{statement.creditCardAccount?.name ?? "-"}</div>
                    {statement.creditCardAccount?.bankName && (
                      <div className="text-xs text-muted-foreground">
                        {statement.creditCardAccount.bankName}
                      </div>
                    )}
                  </TableCell>

                  <TableCell>{formatCurrency(statement.totalAmount)}</TableCell>

                  <TableCell>
                    {statement.itemCount === 1
                      ? "1 item"
                      : `${statement.itemCount} itens`}
                  </TableCell>

                  <TableCell>{formatDate(statement.closingDate)}</TableCell>
                  <TableCell>{formatDate(statement.dueDate)}</TableCell>
                  <TableCell>{formatDate(statement.paymentDate)}</TableCell>

                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(statement.status)}>
                      {creditCardStatementStatusLabels[statement.status]}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="size-4" />
                          <span className="sr-only">
                            Abrir ações da fatura
                          </span>
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end" className="w-64">
                        <DropdownMenuItem
                          onSelect={() => setStatementToManageDocument(statement)}
                        >
                          <FileText className="mr-2 size-4" />

                          {statement.statementDocument
                            ? "Gerenciar extrato da fatura"
                            : canFinanceWrite && statement.status !== "CANCELED"
                              ? "Anexar extrato da fatura"
                              : "Ver extrato da fatura"}
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onSelect={() => setStatementToViewItems(statement)}
                        >
                          <ListChecks className="mr-2 size-4" />
                          Ver itens da fatura
                        </DropdownMenuItem>

                        <ExportCreditCardStatementReportButton
                          statement={statement}
                          presentation="menu-item"
                        />

                        {canFinanceWrite && (
                          <>
                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              disabled={!canImportStatement(statement)}
                              onSelect={() => setStatementToImport(statement)}
                            >
                              <FileUp className="mr-2 size-4" />
                              Importar fatura
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              disabled={!canAddItemToStatement(statement)}
                              onSelect={() => setStatementToAddItem(statement)}
                            >
                              <Plus className="mr-2 size-4" />
                              Adicionar item
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              disabled={!canPayStatement(statement)}
                              onSelect={() => setStatementToPay(statement)}
                            >
                              <CreditCard className="mr-2 size-4" />
                              Pagar fatura
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              disabled={!canCancelStatement(statement)}
                              onSelect={() => setStatementToCancel(statement)}
                            >
                              <Trash2 className="mr-2 size-4" />
                              Cancelar fatura
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {statementToManageDocument && (
        <CreditCardStatementDocumentDialog
          statement={statementToManageDocument}
          canManageDocuments={
            canFinanceWrite &&
            statementToManageDocument.status !== "CANCELED"
          }
          open={Boolean(statementToManageDocument)}
          onOpenChange={(open) => {
            if (!open) {
              setStatementToManageDocument(null)
            }
          }}
          trigger={null}
        />
      )}

      {statementToViewItems && (
        <ViewCreditCardStatementItemsDialog
          statement={statementToViewItems}
          open={Boolean(statementToViewItems)}
          onOpenChange={(open) => {
            if (!open) {
              setStatementToViewItems(null)
            }
          }}
          trigger={null}
        />
      )}

      {statementToImport && (
        <ImportCreditCardStatementDialog
          statement={statementToImport}
          open={Boolean(statementToImport)}
          onOpenChange={(open) => {
            if (!open) {
              setStatementToImport(null)
            }
          }}
          trigger={null}
        />
      )}

      {statementToAddItem && (
        <AddCreditCardStatementItemDialog
          statement={statementToAddItem}
          open={Boolean(statementToAddItem)}
          onOpenChange={(open) => {
            if (!open) {
              setStatementToAddItem(null)
            }
          }}
          trigger={null}
        />
      )}

      {statementToPay && (
        <PayCreditCardStatementDialog
          statement={statementToPay}
          open={Boolean(statementToPay)}
          onOpenChange={(open) => {
            if (!open) {
              setStatementToPay(null)
            }
          }}
          trigger={null}
        />
      )}

      <ConfirmActionDialog
        open={Boolean(statementToCancel)}
        onOpenChange={(open) => {
          if (!open) {
            setStatementToCancel(null)
          }
        }}
        title="Cancelar fatura?"
        description={
          <>
            A fatura <strong>{statementToCancel?.name}</strong> será cancelada. Se
            o backend estiver com a regra recomendada, os itens dessa fatura também
            serão cancelados.
          </>
        }
        confirmLabel="Cancelar fatura"
        pendingLabel="Cancelando..."
        cancelLabel="Voltar"
        isPending={cancelStatementMutation.isPending}
        isDestructive
        onConfirm={handleCancelStatement}
      />
    </>
  )
}
