import { MoreHorizontal, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { FinancialTransaction } from "../financial-transaction-types"
import { EditFinancialTransactionDialog } from "./edit-financial-transaction-dialog"
import { ManageTransactionAllocationsDialog } from "./manage-transaction-allocations-dialog"
import { useCancelFinancialTransaction } from "../hooks/use-cancel-financial-transaction"
import { toast } from "sonner"
import { useState } from "react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { ViewFinancialTransactionDialog } from "./view-financial-transaction-dialog"
import { ClassifyFinancialTransactionDialog } from "./classify-financial-transaction-dialog"
import { FinancialTransactionAttachmentsDialog } from "@/features/attachments/components/financial-transaction-attachments-dialog"
import { usePermissions } from "@/features/auth/hooks/use-permissions"
import { LinkCreditCardPaymentDialog } from "@/features/credit-card-statements/components/link-credit-card-payment-dialog"
import { getApiErrorMessage } from "@/utils/api-error"

type FinancialTransactionActionsProps = {
  transaction: FinancialTransaction
}

export function FinancialTransactionActions({ transaction, }: FinancialTransactionActionsProps) {

  const { canFinanceWrite } = usePermissions()

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const cancelFinancialTransactionMutation = useCancelFinancialTransaction()

  function handleCancelTransaction(event: React.MouseEvent) {
    event.preventDefault()

    cancelFinancialTransactionMutation.mutate(transaction.id, {
      onSuccess: () => {
        toast.success("Transação cancelada com sucesso.")
        setCancelDialogOpen(false)
      },
      onError: (error) => {
        toast.error(
          getApiErrorMessage(
            error,
            "Não foi possível cancelar a transação. Verifique se ela não possui alocações vinculadas.",
          ),
        )
      },
    })
  }

  const needsClassification =
    (transaction.source === "OFX" || transaction.source === "CSV") &&
    transaction.status === "SETTLED" &&
    transaction.type !== "TRANSFER" &&
    !transaction.category

  const canEdit =
    transaction.status !== "CANCELED" &&
    transaction.status !== "IMPORTED" &&
    !needsClassification

  const canManageAllocations =
    transaction.status === "SETTLED" &&
    !needsClassification

  const canManageAttachments =
    transaction.status !== "CANCELED" &&
    transaction.status !== "IMPORTED" &&
    !needsClassification

  const canCancel = transaction.status !== "CANCELED"

  const canLinkCreditCardPayment =
    (transaction.source === "OFX" || transaction.source === "CSV") &&
    transaction.status === "SETTLED" &&
    transaction.type === "EXPENSE" &&
    transaction.account.type !== "CREDIT_CARD" &&
    !transaction.category

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="size-4" />
            <span className="sr-only">Abrir ações</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">

          <ViewFinancialTransactionDialog transaction={transaction} />

          {canFinanceWrite && canEdit && (
            <EditFinancialTransactionDialog transaction={transaction} />
          )}

          {canFinanceWrite && canManageAllocations && (
            <ManageTransactionAllocationsDialog transaction={transaction} />
          )}

          {canFinanceWrite && canLinkCreditCardPayment && (
            <LinkCreditCardPaymentDialog transaction={transaction} />
          )}

          {canFinanceWrite && needsClassification && (
            <ClassifyFinancialTransactionDialog transaction={transaction} />
          )}

          {canFinanceWrite && canManageAttachments && (
            <FinancialTransactionAttachmentsDialog transaction={transaction} />
          )}

          {canFinanceWrite && canCancel && (
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setCancelDialogOpen(true)}
            >
              <Trash2 className="mr-2 size-4" />
              Cancelar
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar transação?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não poderá ser desfeita. A transação{" "}
              <strong>
                {transaction.description?.trim() ||
                  transaction.rawDescription?.trim() ||
                  "esta transação"}
              </strong>{" "}
              será cancelada.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {cancelFinancialTransactionMutation.isError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              Não foi possível cancelar a transação. Verifique se ela não possui
              alocações vinculadas.
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelFinancialTransactionMutation.isPending}>
              Cancelar
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={handleCancelTransaction}
              disabled={cancelFinancialTransactionMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelFinancialTransactionMutation.isPending ? "Cancelando..." : "Cancelar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}