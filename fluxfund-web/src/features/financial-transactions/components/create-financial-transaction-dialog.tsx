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

export function CreateFinancialTransactionDialog() {
  const [open, setOpen] = useState(false)

  const createFinancialTransactionMutation = useCreateFinancialTransaction()

  const createAccountTransferMutation = useCreateAccountTransfer()

  async function handleCreateFinancialTransaction(
    submission: CreateManualTransactionSubmission,
  ) {
    const {
      data,
      transferDirection,
      transferCounterpartyAccountId,
      matchingTransactionId,
    } = submission

    try {
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

        await createAccountTransferMutation
          .mutateAsync({
            sourceAccountId,

            destinationAccountId,

            transferDate:
              data.settlementDate,

            amount:
              data.expectedAmount,

            description:
              data.description?.trim() || null,

            matchingTransactionId,
          })

        toast.success(
          "Transferência criada com sucesso.",
        )
      } else {
        await createFinancialTransactionMutation
          .mutateAsync({
            accountId:
              data.accountId,

            type:
              data.type,

            categoryId:
              data.categoryId || null,

            dueDate:
              data.dueDate || null,

            settlementDate:
              data.settlementDate || null,

            expectedAmount:
              data.expectedAmount,

            settledAmount:
              data.settledAmount ?? null,

            description:
              data.description?.trim() || null,

            documentNumber:
              data.documentNumber || null,

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

            allocations: [],
          })

        toast.success(
          "Transação criada com sucesso.",
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
            description="Cadastre a transação e configure transferências em uma única etapa."
          />

          <AppDialogBody>
            <CreateManualTransactionForm
              onSubmit={handleCreateFinancialTransaction}
              isSubmitting={
                createFinancialTransactionMutation.isPending ||
                createAccountTransferMutation.isPending
              }
            />
          </AppDialogBody>
        </AppDialogContent>
      </Dialog>
    </>
  )
}