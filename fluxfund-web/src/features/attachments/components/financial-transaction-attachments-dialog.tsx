import { Paperclip } from "lucide-react"
import { useState } from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { TransactionAttachmentsSection } from "@/features/attachments/components/transaction-attachments-section"
import type { FinancialTransaction } from "@/features/financial-transactions/financial-transaction-types"

type FinancialTransactionAttachmentsDialogProps = {
  transaction: FinancialTransaction
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode | null
}

export function FinancialTransactionAttachmentsDialog({
  transaction,
  open,
  onOpenChange,
  trigger
}: FinancialTransactionAttachmentsDialogProps) {

  const [internalOpen, setInternalOpen] = useState(false)

  const dialogOpen = open ?? internalOpen
  const setDialogOpen = onOpenChange ?? setInternalOpen

  const transactionDescription =
    transaction.description?.trim() ||
    transaction.rawDescription?.trim() ||
    "esta transação"

  return (
    <>
    {trigger === undefined ? (
      <DropdownMenuItem
        onSelect={(event) => {
          event.preventDefault()
          setDialogOpen(true)
        }}
      >
        <Paperclip className="mr-2 size-4" />
        Anexos
      </DropdownMenuItem>
    ) : (
      trigger
    )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Anexos da transação</DialogTitle>
            <DialogDescription>
              Gerencie os arquivos vinculados a {transactionDescription}.
            </DialogDescription>
          </DialogHeader>

          <TransactionAttachmentsSection
            transactionId={transaction.id}
            enabled={dialogOpen}
            mode="manage"
          />
        </DialogContent>
      </Dialog>
    </>
  )
}