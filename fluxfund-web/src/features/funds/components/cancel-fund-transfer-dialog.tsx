import { AlertTriangle } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { getApiErrorMessage } from "@/utils/api-error"
import { formatCurrency, formatDate } from "@/utils/formatters"
import type { FundTransfer } from "../fund-types"
import { useCancelFundTransfer } from "../hooks/use-cancel-fund-transfer"

type CancelFundTransferDialogProps = {
  transfer: FundTransfer
}

export function CancelFundTransferDialog({
  transfer,
}: CancelFundTransferDialogProps) {
  const [open, setOpen] = useState(false)

  const cancelTransferMutation = useCancelFundTransfer()

  function handleCancelTransfer() {
    cancelTransferMutation.mutate(transfer.id, {
      onSuccess: () => {
        toast.success("Transferência entre fundos cancelada com sucesso.")
        setOpen(false)
      },
      onError: (error) => {
        toast.error(
          getApiErrorMessage(
            error,
            "Não foi possível cancelar a transferência entre fundos.",
          ),
        )
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="text-destructive hover:text-destructive"
        >
          Cancelar
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancelar transferência entre fundos?</DialogTitle>
          <DialogDescription>
            Essa ação cancela a movimentação interna sem apagar o histórico.
            O saldo dos fundos será recalculado sem essa transferência.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
          <div className="flex gap-2">
            <AlertTriangle className="mt-0.5 size-4 text-destructive" />

            <div className="space-y-1">
              <p className="font-medium">
                {transfer.sourceFund.name} → {transfer.destinationFund.name}
              </p>

              <p className="text-muted-foreground">
                Data: {formatDate(transfer.transferDate)}
              </p>

              <p className="text-muted-foreground">
                Valor: {formatCurrency(transfer.amount)}
              </p>

              {transfer.description && (
                <p className="text-muted-foreground">
                  Motivo: {transfer.description}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            disabled={cancelTransferMutation.isPending}
            onClick={() => setOpen(false)}
          >
            Voltar
          </Button>

          <Button
            type="button"
            variant="destructive"
            disabled={cancelTransferMutation.isPending}
            onClick={handleCancelTransfer}
          >
            {cancelTransferMutation.isPending
              ? "Cancelando..."
              : "Cancelar transferência"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}