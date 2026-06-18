import { toast } from "sonner"

import { AppDialogSection } from "@/components/layout/app-dialog"
import type { FinancialTransaction } from "../financial-transaction-types"
import type { FinancialTransactionFormData } from "../financial-transaction-schema"
import { FinancialTransactionForm } from "./financial-transaction-form"
import { useUpdateFinancialTransaction } from "../hooks/use-update-financial-transaction"
import { normalizeFiscalDocumentNote } from "../financial-transaction-labels"

type TransactionEditPanelProps = {
  transaction: FinancialTransaction
  onSaved?: () => void
}

export function TransactionEditPanel({
  transaction,
  onSaved,
}: TransactionEditPanelProps) {
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

          fiscalDocumentPolicy:
            data.type === "EXPENSE" ? data.fiscalDocumentPolicy : "CATEGORY",

          fiscalDocumentNote:
            data.type === "EXPENSE"
              ? normalizeFiscalDocumentNote(
                  data.fiscalDocumentPolicy,
                  data.fiscalDocumentNote,
                )
              : null,
        },
      },
      {
        onSuccess: () => {
          toast.success("Transação atualizada com sucesso.")
          onSaved?.()
        },
        onError: () => {
          toast.error("Não foi possível atualizar a transação.")
        },
      },
    )
  }

  return (
    <AppDialogSection
      title="Editar transação"
      description="Altere os dados principais desta transação."
    >
      {updateFinancialTransactionMutation.isError && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          Não foi possível atualizar a transação. Verifique os dados e tente novamente.
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

          fiscalDocumentPolicy: transaction.fiscalDocumentPolicy ?? "CATEGORY",
          fiscalDocumentNote: transaction.fiscalDocumentNote ?? "",
        }}
        disableAccountField
        submitLabel="Salvar alterações"
        onSubmit={handleUpdateFinancialTransaction}
        isSubmitting={updateFinancialTransactionMutation.isPending}
      />
    </AppDialogSection>
  )
}