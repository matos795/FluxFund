import { CreditCard, FileDown, FileText, FileUp, History, ListChecks, MoreHorizontal, Plus, Trash2 } from "lucide-react"
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
import { creditCardStatementPaymentStatusLabels, creditCardStatementStatusLabels } from "../credit-card-statement-labels"
import type { CreditCardStatement } from "../credit-card-statement-types"
import { useCancelCreditCardStatement } from "../hooks/use-cancel-credit-card-statement"
import { AddCreditCardStatementItemDialog } from "./add-credit-card-statement-item-dialog"
import { PayCreditCardStatementDialog } from "./pay-credit-card-statement-dialog"
import { CreditCardStatementPaymentsDialog } from "./credit-card-statement-payments-dialog"
import { ViewCreditCardStatementItemsDialog } from "./view-credit-card-statement-items-dialog"
import { ImportCreditCardStatementDialog } from "./import-credit-card-statement-dialog"
import { ConfirmActionDialog } from "@/components/layout/confirm-action-dialog"
import { CreditCardStatementDocumentDialog } from "./credit-card-statement-document-dialog"
import { useExportCreditCardStatementPdf } from "@/features/reports/hooks/use-export-credit-card-statement-pdf"
import { getApiErrorMessage } from "@/utils/api-error"
import { downloadFile } from "@/utils/download-file"

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

  const [statementToViewPayments, setStatementToViewPayments] =
    useState<CreditCardStatement | null>(null)

  const cancelStatementMutation = useCancelCreditCardStatement()

  const exportCreditCardStatementPdfMutation = useExportCreditCardStatementPdf()

  function getPaymentStatusBadgeVariant(
    status: CreditCardStatement["paymentStatus"],
  ) {
    if (status === "PAID") {
      return "default"
    }

    if (status === "PARTIALLY_PAID") {
      return "secondary"
    }

    return "outline"
  }

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

  function handleExportCreditCardStatementPdf(
    statement: CreditCardStatement,
  ) {
    exportCreditCardStatementPdfMutation.mutate(statement.id, {
      onSuccess: (blob) => {
        downloadFile(
          blob,
          `relatorio-fatura-${statement.dueDate}.pdf`,
        )

        toast.success(
          `Relatório da fatura "${statement.name}" exportado com sucesso.`,
        )
      },
      onError: (error) => {
        toast.error(
          getApiErrorMessage(
            error,
            "Não foi possível exportar o relatório da fatura.",
          ),
        )
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
    return (
      statement.status !== "PAID" &&
      statement.status !== "CANCELED" &&
      statement.outstandingAmount > 0 &&
      statement.unlinkedPaymentCount === 0
    )
  }

  function canCancelStatement(statement: CreditCardStatement) {
    return (
      statement.paymentCount === 0 &&
      statement.status !== "PAID" &&
      statement.status !== "CANCELED"
    )
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
                <TableHead>Ciclo / pagamento</TableHead>
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

                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {formatCurrency(
                          statement.totalAmount,
                        )}
                      </div>

                      {statement.previousBalanceAmount > 0 && (
                        <div className="text-xs text-muted-foreground">
                          Inclui saldo anterior:{" "}
                          {formatCurrency(statement.previousBalanceAmount)}
                        </div>
                      )}

                      {statement.paymentCount > 0 && (
                        <div className="text-xs text-muted-foreground">
                          Pago:{" "}
                          {formatCurrency(statement.paidAmount)}
                          {" · "}
                          Restante:{" "}
                          {formatCurrency(statement.outstandingAmount)}
                        </div>
                      )}

                      {statement.unlinkedPaymentCount > 0 && (
                        <div className="mt-1 text-xs font-medium text-amber-700">
                          {statement.unlinkedPaymentCount === 1
                            ? "1 pagamento aguardando vínculo bancário"
                            : `${statement.unlinkedPaymentCount} pagamentos aguardando vínculo bancário`}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    {statement.itemCount === 1
                      ? "1 item"
                      : `${statement.itemCount} itens`}
                  </TableCell>

                  <TableCell>{formatDate(statement.closingDate)}</TableCell>
                  <TableCell>{formatDate(statement.dueDate)}</TableCell>
                  <TableCell>{formatDate(statement.lastPaymentDate)}</TableCell>

                  <TableCell>
                    <div className="flex flex-col items-start gap-1">
                      <Badge variant={getStatusBadgeVariant(statement.status)}>
                        {creditCardStatementStatusLabels[statement.status]}
                      </Badge>

                      <Badge
                        variant={getPaymentStatusBadgeVariant(
                          statement.paymentStatus,
                        )}
                      >
                        {
                          creditCardStatementPaymentStatusLabels[
                          statement.paymentStatus
                          ]
                        }
                      </Badge>
                    </div>
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

                        <DropdownMenuItem
                          onSelect={() => setStatementToViewPayments(statement)}
                        >
                          <History className="mr-2 size-4" />
                          Ver pagamentos
                          {statement.unlinkedPaymentCount > 0
                            ? ` (${statement.unlinkedPaymentCount} pendentes)`
                            : ""}
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          disabled={
                            statement.status === "CANCELED" ||
                            exportCreditCardStatementPdfMutation.isPending
                          }
                          onSelect={() =>
                            handleExportCreditCardStatementPdf(statement)
                          }
                        >
                          <FileDown className="mr-2 size-4" />

                          {exportCreditCardStatementPdfMutation.isPending
                            ? "Gerando relatório..."
                            : "Exportar relatório PDF"}
                        </DropdownMenuItem>

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
                              Registrar pagamento
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


      {statementToViewPayments && (
        <CreditCardStatementPaymentsDialog
          statement={statementToViewPayments}
          canManage={canFinanceWrite}
          open={Boolean(statementToViewPayments)}
          onOpenChange={(open) => {
            if (!open) {
              setStatementToViewPayments(null)
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
            A fatura <strong>{statementToCancel?.name}</strong> e seus itens
            serão cancelados. Essa ação não poderá ser realizada caso já
            existam pagamentos vinculados.
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
