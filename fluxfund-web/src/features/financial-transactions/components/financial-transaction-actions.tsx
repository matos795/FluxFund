import { MoreHorizontal } from "lucide-react"

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

type FinancialTransactionActionsProps = {
  transaction: FinancialTransaction
}

export function FinancialTransactionActions({ transaction, }: FinancialTransactionActionsProps) {

  const canEdit = transaction.status !== "CANCELED" && transaction.status !== "IMPORTED"
  const canManageAllocations = transaction.status === "SETTLED"
  const canClassify = transaction.status === "IMPORTED"
  const canCancel = transaction.status !== "CANCELED"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="size-4" />
          <span className="sr-only">Abrir ações</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        {canEdit && (
          <EditFinancialTransactionDialog transaction={transaction} />
        )}

        {canManageAllocations && (
          <ManageTransactionAllocationsDialog transaction={transaction} />
        )}

        {canClassify && (
          <DropdownMenuItem>
            Classificar
          </DropdownMenuItem>
        )}

        {canCancel && (
          <DropdownMenuItem className="text-destructive">
            Cancelar
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}