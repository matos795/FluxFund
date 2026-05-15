import { Plus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import type { FinancialTransactionFormData } from "@/features/financial-transactions/financial-transaction-schema"
import { FinancialTransactionForm } from "@/features/financial-transactions/components/financial-transaction-form"
import { useCreateFinancialTransaction } from "@/features/financial-transactions/hooks/use-create-financial-transaction"

export function CreateFinancialTransactionDialog() {
  const [open, setOpen] = useState(false)

  const createFinancialTransactionMutation = useCreateFinancialTransaction()

  function handleCreateFinancialTransaction(data: FinancialTransactionFormData) {
    createFinancialTransactionMutation.mutate(
      {
        accountId: data.accountId,
        type: data.type,
        categoryId: data.type === "TRANSFER" ? null : data.categoryId || null,

        dueDate: data.dueDate || null,
        settlementDate: data.settlementDate || null,

        expectedAmount: data.expectedAmount,
        settledAmount: data.settledAmount !== undefined && data.settledAmount !== null
          ? data.settledAmount
          : null,

        description: data.description,
        documentNumber: data.documentNumber || null,

        allocations: [],
      },
      {
        onSuccess: () => {
          toast.success("Transação criada com sucesso.")
          setOpen(false)
        },
        onError: () => {
          toast.error("Não foi possível criar a transação.")
        },
      },
    )
  }

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus className="mr-2 size-4" />
        Nova transação
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Nova transação</DialogTitle>
            <DialogDescription>
              Cadastre uma transação manual com os dados principais. As
              alocações em fundos serão feitas depois.
            </DialogDescription>
          </DialogHeader>

          <FinancialTransactionForm
            onSubmit={handleCreateFinancialTransaction}
            isSubmitting={createFinancialTransactionMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}