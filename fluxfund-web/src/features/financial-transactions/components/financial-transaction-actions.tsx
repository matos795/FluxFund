import { useState } from "react"

import {
  CheckCircle2,
  Eye,
  FileSignature,
  MoreHorizontal,
  Paperclip,
  Pencil,
  Trash2,
  WalletCards,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { usePermissions } from "@/features/auth/hooks/use-permissions"
import { LinkCreditCardPaymentDialog } from "@/features/credit-card-statements/components/link-credit-card-payment-dialog"
import { getApiErrorMessage } from "@/utils/api-error"

import type { FinancialTransaction } from "../financial-transaction-types"
import type { TransactionWorkspaceTab } from "../transaction-workspace-types"
import { needsFinancialTransactionClassification } from "../financial-transaction-rules"
import { useCancelFinancialTransaction } from "../hooks/use-cancel-financial-transaction"
import { CancelAccountTransferDialog } from "./cancel-account-transfer-dialog"
import { TransactionWorkspaceDialog } from "./transaction-workspace-dialog"
import { ConfirmActionDialog } from "@/components/layout/confirm-action-dialog"
import { useFinancialTransaction } from "../hooks/use-financial-transaction"
import { ReceiptDraftDialog } from "@/features/receipts/components/receipt-draft-dialog"

type FinancialTransactionActionsProps = {
  transaction: FinancialTransaction
}

export function FinancialTransactionActions({
  transaction,
}: FinancialTransactionActionsProps) {
  const { canFinanceWrite } = usePermissions()

  const [workspaceOpen, setWorkspaceOpen] = useState(false)

  const {
    data:
    refreshedTransaction,
  } = useFinancialTransaction({
    id: workspaceOpen ? transaction.id : null,
  })

  const currentTransaction = refreshedTransaction ?? transaction

  const [workspaceTab, setWorkspaceTab] =
    useState<TransactionWorkspaceTab>("overview")

  function openWorkspace(tab: TransactionWorkspaceTab) {
    setWorkspaceTab(tab)
    setWorkspaceOpen(true)
  }

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancelTransferDialogOpen, setCancelTransferDialogOpen] = useState(false)

  const [
    receiptDialogOpen,
    setReceiptDialogOpen,
  ] = useState(false)

  const cancelFinancialTransactionMutation = useCancelFinancialTransaction()

  const needsClassification =
    needsFinancialTransactionClassification(
      currentTransaction,
    )

  const canEdit =
    currentTransaction.status !== "CANCELED" &&
    currentTransaction.status !== "IMPORTED" &&
    currentTransaction.type !== "TRANSFER" &&
    !needsClassification

  const canManageAllocations =
    currentTransaction.status === "SETTLED" &&
    currentTransaction.type !== "TRANSFER" &&
    !needsClassification

  const canManageAttachments =
    currentTransaction.status !== "CANCELED" &&
    currentTransaction.status !== "IMPORTED" &&
    currentTransaction.type !== "TRANSFER" &&
    !needsClassification

  const canCancel =
    currentTransaction.status !== "CANCELED" && currentTransaction.type !== "TRANSFER"

  const canLinkCreditCardPayment =
    (currentTransaction.source === "OFX" || currentTransaction.source === "CSV") &&
    currentTransaction.status === "SETTLED" &&
    currentTransaction.type === "EXPENSE" &&
    currentTransaction.account.type !== "CREDIT_CARD" &&
    !currentTransaction.category

  const canCancelAccountTransfer =
    currentTransaction.type === "TRANSFER" &&
    currentTransaction.status !== "CANCELED" &&
    Boolean(currentTransaction.transferGroupId)

  const canCreateTransactionReceipt =
    currentTransaction.status ===
    "SETTLED" &&
    currentTransaction.type !==
    "TRANSFER" &&
    currentTransaction.allocations
      .length === 0

  function handleCancelTransaction() {
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
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault()
              openWorkspace("overview")
            }}
          >
            <Eye className="mr-2 size-4" />
            Detalhes
          </DropdownMenuItem>

          {canFinanceWrite && canEdit && (
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault()
                openWorkspace("edit")
              }}
            >
              <Pencil className="mr-2 size-4" />
              Editar
            </DropdownMenuItem>
          )}

          {canFinanceWrite && canManageAllocations && (
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault()
                openWorkspace("allocations")
              }}
            >
              <WalletCards className="mr-2 size-4" />
              Alocações
            </DropdownMenuItem>
          )}

          {canFinanceWrite && canManageAttachments && (
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault()
                openWorkspace("attachments")
              }}
            >
              <Paperclip className="mr-2 size-4" />
              Anexos
            </DropdownMenuItem>
          )}

          {canFinanceWrite && needsClassification && (
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault()
                openWorkspace("classify")
              }}
            >
              <CheckCircle2 className="mr-2 size-4" />
              Classificar
            </DropdownMenuItem>
          )}

          {canFinanceWrite && canLinkCreditCardPayment && (
            <LinkCreditCardPaymentDialog
              transaction={
                currentTransaction
              }
            />
          )}

          {canFinanceWrite &&
            canCreateTransactionReceipt && (
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault()

                  setReceiptDialogOpen(
                    true,
                  )
                }}
              >
                <FileSignature className="mr-2 size-4" />

                Criar recibo
              </DropdownMenuItem>
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

          {canFinanceWrite && canCancelAccountTransfer && (
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={(event) => {
                event.preventDefault()
                setCancelTransferDialogOpen(true)
              }}
            >
              <Trash2 className="mr-2 size-4" />
              Cancelar transferência
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <TransactionWorkspaceDialog
        transaction={
          currentTransaction
        }
        open={workspaceOpen}
        onOpenChange={setWorkspaceOpen}
        activeTab={workspaceTab}
        onTabChange={setWorkspaceTab}
        canEdit={canFinanceWrite && canEdit}
        canManageAllocations={canFinanceWrite && canManageAllocations}
        canManageAttachments={canFinanceWrite && canManageAttachments}
        canClassify={canFinanceWrite && needsClassification}
      />

      <ReceiptDraftDialog
        open={
          receiptDialogOpen
        }
        onOpenChange={
          setReceiptDialogOpen
        }
        source={{
          sourceType:
            "TRANSACTION",

          defaultDirection:
            currentTransaction.type ===
              "INCOME"
              ? "RECEIVED_BY_ORGANIZATION"
              : "PAID_BY_ORGANIZATION",

          financialTransactionId:
            currentTransaction.id,

          defaultReceiptType:
            currentTransaction.type ===
              "INCOME"
              ? "OTHER_INCOME"
              : "OTHER_PAYMENT",

          defaultAmount:
            Math.abs(
              currentTransaction
                .settledAmount ??
              0,
            ),

          defaultPaymentDate:
            currentTransaction
              .settlementDate ??
            undefined,

          defaultPurpose:
            currentTransaction
              .description?.trim() ||
            currentTransaction
              .rawDescription?.trim() ||
            "",

          description:
            currentTransaction
              .description?.trim() ||
            currentTransaction
              .rawDescription?.trim() ||
            "Transação financeira",
        }}
      />

      <CancelAccountTransferDialog
        transaction={
          currentTransaction
        }
        open={cancelTransferDialogOpen}
        onOpenChange={setCancelTransferDialogOpen}
      />

      <ConfirmActionDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        title="Cancelar transação?"
        description={
          <>
            Essa ação não poderá ser desfeita. A transação{" "}
            <strong>
              {transaction.description?.trim() ||
                transaction.rawDescription?.trim() ||
                "esta transação"}
            </strong>{" "}
            será cancelada.
          </>
        }
        confirmLabel="Cancelar"
        pendingLabel="Cancelando..."
        cancelLabel="Voltar"
        isPending={cancelFinancialTransactionMutation.isPending}
        isDestructive
        errorMessage={
          cancelFinancialTransactionMutation.isError
            ? "Não foi possível cancelar a transação. Verifique se ela não possui alocações vinculadas."
            : null
        }
        onConfirm={handleCancelTransaction}
      />
    </>
  )
}
