import { AlertTriangle } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
    Dialog,
} from "@/components/ui/dialog"
import type { FinancialTransaction } from "../financial-transaction-types"
import { useCancelAccountTransfer } from "../hooks/use-cancel-account-transfer"
import { getApiErrorMessage } from "@/utils/api-error"
import { formatCurrency } from "@/utils/formatters"
import { AppDialogBody, AppDialogContent, AppDialogFooter, AppDialogHeader } from "@/components/layout/app-dialog"

type CancelAccountTransferDialogProps = {
    transaction: FinancialTransaction
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CancelAccountTransferDialog({
    transaction,
    open,
    onOpenChange,
}: CancelAccountTransferDialogProps) {
    const cancelTransferMutation = useCancelAccountTransfer()

    const amount = Math.abs(
        transaction.settledAmount ?? transaction.expectedAmount ?? 0,
    )

    const counterpartyName =
        transaction.transferCounterpartyAccount?.name ?? "outra conta"

    function handleCancelTransfer() {
        cancelTransferMutation.mutate(transaction.id, {
            onSuccess: () => {
                toast.success("Transferência cancelada com sucesso.")
                onOpenChange(false)
            },
            onError: (error) => {
                toast.error(
                    getApiErrorMessage(
                        error,
                        "Não foi possível cancelar a transferência.",
                    ),
                )
            },
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <AppDialogContent size="sm">
                <AppDialogHeader
                    icon={<AlertTriangle className="size-4 text-destructive" />}
                    title="Cancelar transferência?"
                    description="Esta ação cancelará todas as pontas da transferência vinculadas ao mesmo grupo. Isso preserva o histórico sem apagar registros."
                />

                <AppDialogBody className="space-y-4">

                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
                        <div className="flex gap-2">
                            <AlertTriangle className="mt-0.5 size-4 text-destructive" />

                            <div className="space-y-1">
                                <p className="font-medium">Transferência entre contas</p>

                                <p className="text-muted-foreground">
                                    Conta atual: {transaction.account.name}
                                </p>

                                <p className="text-muted-foreground">
                                    Conta contraparte: {counterpartyName}
                                </p>

                                <p className="text-muted-foreground">
                                    Valor: {formatCurrency(amount)}
                                </p>
                            </div>
                        </div>
                    </div>

                </AppDialogBody>

                <AppDialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={cancelTransferMutation.isPending}
                        onClick={() => onOpenChange(false)}
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
                </AppDialogFooter>
            </AppDialogContent>
        </Dialog>
    )
}