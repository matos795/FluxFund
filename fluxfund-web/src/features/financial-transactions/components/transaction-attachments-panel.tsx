import { AppDialogSection } from "@/components/layout/app-dialog"
import { TransactionAttachmentsSection } from "@/features/attachments/components/transaction-attachments-section"

import type { FinancialTransaction } from "../financial-transaction-types"

type TransactionAttachmentsPanelProps = {
  transaction: FinancialTransaction
  enabled: boolean
}

export function TransactionAttachmentsPanel({
  transaction,
  enabled,
}: TransactionAttachmentsPanelProps) {
  return (
    <AppDialogSection
      title="Anexos"
      description="Gerencie documentos fiscais, comprovantes e outros arquivos vinculados à transação."
    >
      <TransactionAttachmentsSection
        transactionId={transaction.id}
        enabled={enabled}
        mode="manage"
      />
    </AppDialogSection>
  )
}