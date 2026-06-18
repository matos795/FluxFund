import { MoreHorizontal, Trash2 } from "lucide-react"
import { useState } from "react"

import { useDeleteAccount } from "@/features/accounts/hooks/use-delete-account"
import type { Account } from "@/features/accounts/types"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EditAccountDialog } from "./edit-account-dialog"
import { toast } from "sonner"
import { usePermissions } from "@/features/auth/hooks/use-permissions"
import { getApiErrorMessage } from "@/utils/api-error"
import { ConfirmActionDialog } from "@/components/layout/confirm-action-dialog"

type AccountActionsProps = {
    account: Account
}

export function AccountActions({ account }: AccountActionsProps) {

    const { canManageAccounts } = usePermissions()

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

    const deleteAccountMutation = useDeleteAccount()

    function handleDeleteAccount() {
        deleteAccountMutation.mutate(account.id, {
            onSuccess: () => {
                toast.success("Conta desativada com sucesso!")
                setDeleteDialogOpen(false)
            },
            onError: (error) => {
                toast.error(
                    getApiErrorMessage(error, "Não foi possível desativar a conta. Verifique se ela não possui transações vinculadas."),
                )
            },
        })
    }

    if (!canManageAccounts) {
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
                    <EditAccountDialog account={account} />
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
                title="Desativar conta?"
                description={
                    <>
                        Essa ação não poderá ser desfeita. A conta{" "}
                        <strong>{account.name}</strong> será desativada.
                    </>
                }
                confirmLabel="Desativar"
                pendingLabel="Desativando..."
                isPending={deleteAccountMutation.isPending}
                isDestructive
                errorMessage={
                    deleteAccountMutation.isError
                        ? "Não foi possível desativar a conta. Verifique se ela não possui transações vinculadas."
                        : null
                }
                onConfirm={handleDeleteAccount}
            />
        </>
    )
}