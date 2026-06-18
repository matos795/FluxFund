import { useState } from "react"
import { toast } from "sonner"

import { AppDialogSection } from "@/components/layout/app-dialog"
import { Button } from "@/components/ui/button"
import type { FinancialTransaction } from "../financial-transaction-types"
import type { FiscalDocumentPolicy } from "../financial-transaction-types"
import {
  fiscalDocumentPolicyRequiresNote,
  normalizeFiscalDocumentNote,
} from "../financial-transaction-labels"
import { useUpdateFinancialTransaction } from "../hooks/use-update-financial-transaction"
import { FiscalDocumentPolicyField } from "./fiscal-document-policy-field"

type TransactionDocumentPolicyPanelProps = {
  transaction: FinancialTransaction
}

export function TransactionDocumentPolicyPanel({
  transaction,
}: TransactionDocumentPolicyPanelProps) {
  const updateTransactionMutation = useUpdateFinancialTransaction()

  const [policy, setPolicy] = useState<FiscalDocumentPolicy>(
    transaction.fiscalDocumentPolicy ?? "CATEGORY",
  )

  const [note, setNote] = useState(transaction.fiscalDocumentNote ?? "")

  const isExpense = transaction.type === "EXPENSE"

  const hasChanged =
    policy !== (transaction.fiscalDocumentPolicy ?? "CATEGORY") ||
    note.trim() !== (transaction.fiscalDocumentNote ?? "")

  function handleSavePolicy() {
    if (!isExpense) {
      return
    }

    if (fiscalDocumentPolicyRequiresNote(policy) && !note.trim()) {
      toast.error("Informe o motivo da regra documental.")
      return
    }

    updateTransactionMutation.mutate(
      {
        id: transaction.id,
        data: {
          type: transaction.type,
          categoryId:
            transaction.type === "TRANSFER"
              ? null
              : transaction.category?.id ?? null,

          dueDate: transaction.dueDate,
          settlementDate: transaction.settlementDate,

          expectedAmount: transaction.expectedAmount,
          settledAmount: transaction.settledAmount,

          description: transaction.description ?? "",
          documentNumber: transaction.documentNumber ?? null,

          fiscalDocumentPolicy: policy,
          fiscalDocumentNote: normalizeFiscalDocumentNote(policy, note),
        },
      },
      {
        onSuccess: () => {
          toast.success("Regra documental atualizada com sucesso.")
        },
        onError: () => {
          toast.error("Não foi possível atualizar a regra documental.")
        },
      },
    )
  }

  if (!isExpense) {
    return null
  }

  return (
    <AppDialogSection
      title="Regra documental"
      description="Defina se esta despesa deve exigir documento fiscal, se foi dispensada ou se o documento está ausente."
    >
      <div className="space-y-4">
        <FiscalDocumentPolicyField
          value={policy}
          note={note}
          disabled={updateTransactionMutation.isPending}
          onValueChange={(value) => {
            setPolicy(value)

            if (value === "CATEGORY" || value === "REQUIRED") {
              setNote("")
            }
          }}
          onNoteChange={setNote}
        />

        <div className="flex justify-end">
          <Button
            type="button"
            disabled={!hasChanged || updateTransactionMutation.isPending}
            onClick={handleSavePolicy}
          >
            {updateTransactionMutation.isPending
              ? "Salvando..."
              : "Salvar regra documental"}
          </Button>
        </div>
      </div>
    </AppDialogSection>
  )
}