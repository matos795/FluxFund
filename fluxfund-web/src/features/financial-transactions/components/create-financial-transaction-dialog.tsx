import { Plus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
} from "@/components/ui/dialog"

import { useCreateFinancialTransaction } from "@/features/financial-transactions/hooks/use-create-financial-transaction"
import { normalizeFiscalDocumentNote } from "../financial-transaction-labels"
import { AppDialogBody, AppDialogContent, AppDialogHeader } from "@/components/layout/app-dialog"
import { useCreateAccountTransfer } from "../hooks/use-create-account-transfer"
import { getApiErrorMessage } from "@/utils/api-error"
import { CreateManualTransactionForm, type CreateManualTransactionSubmission } from "./create-manual-transaction-form"
import { useUploadAttachment } from "@/features/attachments/hooks/use-upload-attachment"

export function CreateFinancialTransactionDialog() {
  const [open, setOpen] = useState(false)

  const createFinancialTransactionMutation = useCreateFinancialTransaction()

  const createAccountTransferMutation = useCreateAccountTransfer()

  const uploadAttachmentMutation = useUploadAttachment()

  async function handleCreateFinancialTransaction(
    submission: CreateManualTransactionSubmission,
  ) {
    const {
      data,
      allocations,
      attachments,
      transferDirection,
      transferCounterpartyAccountId,
      matchingTransactionId,
      allowUnmatchedCreation,
    } = submission

    try {

      let attachmentTargetTransactionId: string

      if (data.type === "TRANSFER") {
        if (
          !transferDirection ||
          !transferCounterpartyAccountId ||
          !data.settlementDate
        ) {
          toast.error(
            "Informe direção, contraparte e data da transferência.",
          )

          return
        }

        const sourceAccountId =
          transferDirection === "OUT"
            ? data.accountId
            : transferCounterpartyAccountId

        const destinationAccountId =
          transferDirection === "OUT"
            ? transferCounterpartyAccountId
            : data.accountId

        const createdTransfers = await createAccountTransferMutation
          .mutateAsync({
            sourceAccountId,
            destinationAccountId,
            transferDate: data.settlementDate,
            amount: data.expectedAmount,
            description: data.description?.trim() || null,
            matchingTransactionId,
            allowUnmatchedCreation,
          })

        const selectedAccountSide =
          createdTransfers.find(
            (transaction) =>
              transaction.account.id ===
              data.accountId,
          )

        if (!selectedAccountSide) {
          throw new Error(
            "A ponta selecionada da transferência não foi retornada.",
          )
        }

        attachmentTargetTransactionId = selectedAccountSide.id

      } else {
        const createdTransaction = await createFinancialTransactionMutation
            .mutateAsync({
              accountId: data.accountId,
              type: data.type,
              categoryId: data.categoryId || null,
              dueDate: data.dueDate || null,
              settlementDate: data.settlementDate || null,
              expectedAmount: data.expectedAmount,
              settledAmount: data.settledAmount ?? null,
              description: data.description?.trim() || null,
              documentNumber: data.documentNumber || null,
              fiscalDocumentPolicy:
                data.type === "EXPENSE"
                  ? data.fiscalDocumentPolicy
                  : "CATEGORY",
              fiscalDocumentNote:
                data.type === "EXPENSE"
                  ? normalizeFiscalDocumentNote(
                    data.fiscalDocumentPolicy,
                    data.fiscalDocumentNote,
                  )
                  : null,
              allocations,
            })

        attachmentTargetTransactionId = createdTransaction.id

      }

      const failedFiles: string[] = []

      for (const attachment of attachments) {
        try {
          await uploadAttachmentMutation.mutateAsync({
            transactionId:
              attachmentTargetTransactionId,
            type: attachment.type,
            file: attachment.file,
          })
        } catch {
          failedFiles.push(
            attachment.file.name,
          )
        }
      }

      if (failedFiles.length === 0) {
        toast.success(
          data.type === "TRANSFER"
            ? "Transferência criada com sucesso."
            : "Transação criada com sucesso.",
        )
      } else if (
        failedFiles.length === attachments.length
      ) {
        toast.warning(
          "A transação foi criada, mas nenhum anexo foi enviado. Envie os arquivos novamente pela ação Anexos.",
        )
      } else {
        toast.warning(
          `A transação foi criada, mas alguns anexos falharam: ${failedFiles.join(", ")}.`,
        )
      }

      setOpen(false)

    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          "Não foi possível criar a transação.",
        ),
      )
    }
  }

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus className="mr-2 size-4" />
        Nova transação
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <AppDialogContent size="xl">
          <AppDialogHeader
            icon={<Plus className="size-4 text-muted-foreground" />}
            title="Nova transação"
            description="Cadastre, classifique, aloque e anexe os documentos da transação em uma única etapa."
          />

          <AppDialogBody>
            <CreateManualTransactionForm
              onSubmit={handleCreateFinancialTransaction}
              isSubmitting={
                createFinancialTransactionMutation.isPending ||
                createAccountTransferMutation.isPending ||
                uploadAttachmentMutation.isPending
              }
            />
          </AppDialogBody>
        </AppDialogContent>
      </Dialog>
    </>
  )
}