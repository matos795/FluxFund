import {
    AlertCircle,
    CheckCircle2,
    FileText,
    Undo2,
} from "lucide-react"

import {
    ConfirmActionDialog,
} from "@/components/layout/confirm-action-dialog"

import {
    getApiErrorMessage,
} from "@/utils/api-error"

import {
    toast,
} from "sonner"
import type { ImportBatch, ImportBatchUndoBlocker, ImportBatchUndoCheck } from "@/features/import-batches/import-batch-types"
import { useImportBatchUndoCheck } from "@/features/import-batches/hooks/use-import-batch-undo-check"
import { useUndoImportBatch } from "@/features/import-batches/hooks/use-undo-import-batch"

function getBlockerMessage(
    blocker:
        ImportBatchUndoBlocker,

    check:
        ImportBatchUndoCheck,
) {

    switch (
    blocker
    ) {

        case "ALREADY_UNDONE":
            return "Esta importação já foi desfeita."

        case "NO_IMPORTED_TRANSACTIONS":
            return "Este arquivo não criou nenhuma transação nova."

        case "TRANSACTION_COUNT_MISMATCH":
            return "A quantidade atual de transações não corresponde à quantidade originalmente importada."

        case "MODIFIED_TRANSACTIONS":
            return `${check.modifiedTransactionCount} transação(ões) foram alteradas depois da importação.`

        case "CLASSIFIED_TRANSACTIONS":
            return `${check.classifiedTransactionCount} transação(ões) já foram classificadas.`

        case "TRANSFER_TRANSACTIONS":
            return `${check.transferTransactionCount} transação(ões) foram transformadas ou vinculadas como transferência.`

        case "ALLOCATIONS":
            return `${check.allocationCount} alocação(ões) já foram vinculadas às transações deste lote.`

        case "ATTACHMENTS":
            return `${check.attachmentCount} anexo(s) já foram incluídos nas transações deste lote.`

        case "RECEIPTS":
            return `${check.receiptCount} recibo(s) estão vinculados às transações deste lote.`

        case "CREDIT_CARD_PAYMENTS":
            return `${check.creditCardPaymentCount} vínculo(s) com pagamento de fatura foram encontrados.`

        case "CREDIT_CARD_STATEMENT_LINKS":
            return `${check.creditCardStatementLinkCount} transação(ões) estão vinculadas a faturas de cartão.`
    }
}

type Props = {
  batch:
    ImportBatch | null

  open:
    boolean

  onOpenChange:
    (
      open:
        boolean,
    ) => void
}

export function ImportBatchUndoDialog({
  batch,
  open,
  onOpenChange,
}: Props) {

  const undoCheckQuery =
    useImportBatchUndoCheck({
      batchId:
        batch?.id ?? "",

      enabled:
        open &&
        Boolean(
          batch,
        ),
    })

  const undoMutation =
    useUndoImportBatch()

  const check =
    undoCheckQuery.data

  const canUndo =
    check?.canUndo ===
    true

  function handleOpenChange(
    nextOpen:
      boolean,
  ) {

    if (!nextOpen) {
      undoMutation.reset()
    }

    onOpenChange(
      nextOpen,
    )
  }

  function handleUndo() {

    if (
      !batch ||
      !check?.canUndo
    ) {
      return
    }

    undoMutation.mutate(
      batch.id,
      {
        onSuccess:
          (
            response,
          ) => {

            toast.success(
              response
                .deletedTransactionCount ===
                1
                ? "Importação desfeita. 1 transação foi removida."
                : `Importação desfeita. ${response.deletedTransactionCount} transações foram removidas.`,
            )

            handleOpenChange(
              false,
            )
          },

        onError:
          (
            error,
          ) => {

            toast.error(
              getApiErrorMessage(
                error,
                "Não foi possível desfazer esta importação.",
              ),
            )
          },
      },
    )
  }

  if (!batch) {
    return null
  }

  return (
    <ConfirmActionDialog
      open={
        open
      }
      onOpenChange={
        handleOpenChange
      }
      title="Desfazer importação?"
      description={
        undoCheckQuery.isLoading
          ? "Verificando se esta importação ainda pode ser desfeita com segurança..."
          : canUndo
            ? (
              <>
                O FluxFund verificou o lote e não encontrou
                alterações posteriores. As transações criadas
                por esta importação serão{" "}
                <strong>
                  excluídas permanentemente
                </strong>
                .
              </>
            )
            : "Esta importação não pode ser desfeita automaticamente porque existem alterações ou vínculos posteriores."
      }
      confirmLabel="Desfazer importação"
      pendingLabel="Desfazendo..."
      cancelLabel="Voltar"
      isPending={
        undoMutation.isPending
      }
      isDisabled={
        !canUndo ||
        undoCheckQuery.isLoading ||
        undoCheckQuery.isError
      }
      isDestructive
      icon={
        <Undo2 className="size-5" />
      }
      errorMessage={
        undoCheckQuery.isError
          ? "Não foi possível verificar a segurança desta importação."
          : undoMutation.isError
            ? "O FluxFund recusou ou não conseguiu concluir o desfazimento. Nenhuma exclusão parcial é permitida."
            : null
      }
      onConfirm={
        handleUndo
      }
    >
      <div className="space-y-4">
        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="flex gap-3">
            <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

            <div className="min-w-0">
              <p
                className="truncate text-sm font-medium"
                title={
                  batch.originalFilename
                }
              >
                {
                  batch.originalFilename
                }
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                {
                  batch.accountName
                }
                {" • "}
                {
                  batch.sourceType
                }
              </p>
            </div>
          </div>
        </div>

        {canUndo &&
          check && (
            <div className="flex gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />

              <div>
                <p className="font-medium">
                  Importação intacta
                </p>

                <p className="mt-1 text-emerald-900">
                  {
                    check.currentTransactionCount
                  }{" "}
                  {
                    check.currentTransactionCount ===
                    1
                      ? "transação será excluída."
                      : "transações serão excluídas."
                  }
                </p>
              </div>
            </div>
          )}

        {check &&
          !check.canUndo &&
          check.blockers.length >
            0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
              <div className="flex gap-2">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />

                <div>
                  <p className="font-medium">
                    Desfazer bloqueado
                  </p>

                  <p className="mt-1 text-xs leading-relaxed text-amber-900">
                    O FluxFund preservará todas as transações deste lote.
                  </p>
                </div>
              </div>

              <ul className="mt-3 space-y-2 pl-6">
                {
                  check.blockers.map(
                    (
                      blocker,
                    ) => (
                      <li
                        key={
                          blocker
                        }
                        className="list-disc"
                      >
                        {
                          getBlockerMessage(
                            blocker,
                            check,
                          )
                        }
                      </li>
                    ),
                  )
                }
              </ul>
            </div>
          )}
      </div>
    </ConfirmActionDialog>
  )
}