import { useState } from "react"
import type { Fund } from "../fund-types"
import { useDeleteFund } from "../hooks/use-delete-fund"
import { toast } from "sonner"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Trash2 } from "lucide-react"
import { EditFundDialog } from "./edit-fund-dialog"
import { usePermissions } from "@/features/auth/hooks/use-permissions"
import { ConfirmActionDialog } from "@/components/layout/confirm-action-dialog"

type FundActionsProps = {
    fund: Fund
}

export function FundActions({ fund }: FundActionsProps) {

    const { canFinanceWrite } = usePermissions()

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

    const deleteFundMutation = useDeleteFund()

    function handleDeleteFund() {
        deleteFundMutation.mutate(fund.id, {
            onSuccess: () => {
                toast.success("Fundo desativado com sucesso!")
                setDeleteDialogOpen(false)
            },
            onError: () => {
                toast.error("Não foi possível desativar o fundo. Verifique se ele não possui transações vinculadas.")
            }
        })
    }

    if (!canFinanceWrite) {
        return null
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <MoreHorizontal className="size-4" />
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                    <EditFundDialog fund={fund} />
                    <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeleteDialogOpen(true)}
                    >
                        <Trash2 className="mr-2 size-4" />
                        Desativar
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <ConfirmActionDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Desativar fundo?"
                description={
                    <>
                        Essa ação não poderá ser desfeita. O fundo{" "}
                        <strong>{fund.name}</strong> será desativado.
                    </>
                }
                confirmLabel="Desativar"
                pendingLabel="Desativando..."
                isPending={deleteFundMutation.isPending}
                isDestructive
                errorMessage={
                    deleteFundMutation.isError
                        ? "Não foi possível desativar o fundo. Verifique se ele não possui transações vinculadas."
                        : null
                }
                onConfirm={handleDeleteFund}
            />
        </>
    )
}