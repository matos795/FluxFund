import { Pencil } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"

import type { FinancialTransaction } from "@/features/financial-transactions/financial-transaction-types"
import type { FinancialTransactionFormData } from "@/features/financial-transactions/financial-transaction-schema"
import { FinancialTransactionForm } from "@/features/financial-transactions/components/financial-transaction-form"
import { useUpdateFinancialTransaction } from "@/features/financial-transactions/hooks/use-update-financial-transaction"

type EditFinancialTransactionDialogProps = {
  transaction: FinancialTransaction
}

export function EditFinancialTransactionDialog({
  transaction,
}: EditFinancialTransactionDialogProps) {
  const [open, setOpen] = useState(false)

  const updateFinancialTransactionMutation = useUpdateFinancialTransaction()

  function handleUpdateFinancialTransaction(data: FinancialTransactionFormData) {
    updateFinancialTransactionMutation.mutate(
      {
        id: transaction.id,
        data: {
          type: data.type,
          categoryId: data.type === "TRANSFER" ? null : data.categoryId || null,

          dueDate: data.dueDate || null,
          settlementDate: data.settlementDate || null,

          expectedAmount: data.expectedAmount,
          settledAmount:
            data.settledAmount !== undefined && data.settledAmount !== null
              ? data.settledAmount
              : null,

          description: data.description ?? "",
          documentNumber: data.documentNumber || null,
        },
      },
      {
        onSuccess: () => {
          toast.success("Transação atualizada com sucesso.")
          setOpen(false)
        },
        onError: () => {
          toast.error("Não foi possível atualizar a transação.")
        },
      },
    )
  }

  return (
    <>
      <DropdownMenuItem
        onSelect={(event) => {
          event.preventDefault()
          setOpen(true)
        }}
      >
        <Pencil className="mr-2 size-4" />
        Editar
      </DropdownMenuItem>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Editar transação</DialogTitle>
            <DialogDescription>
              Altere os dados principais da transação financeira selecionada.
              As alocações são gerenciadas separadamente.
            </DialogDescription>
          </DialogHeader>

          {updateFinancialTransactionMutation.isError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              Não foi possível atualizar a transação. Verifique os dados e
              tente novamente.
            </div>
          )}

          <FinancialTransactionForm
            defaultValues={{
              accountId: transaction.account.id,
              type: transaction.type,
              categoryId: transaction.category?.id ?? "",

              dueDate: transaction.dueDate ?? "",
              settlementDate: transaction.settlementDate ?? "",

              expectedAmount: transaction.expectedAmount,
              settledAmount: transaction.settledAmount ?? undefined,

              description: transaction.description ?? "",
              documentNumber: transaction.documentNumber ?? "",
            }}
            disableAccountField
            submitLabel="Salvar alterações"
            onSubmit={handleUpdateFinancialTransaction}
            isSubmitting={updateFinancialTransactionMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}