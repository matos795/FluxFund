import { MoreHorizontal, Trash2 } from "lucide-react"
import { useState } from "react"

import { useDeleteAccount } from "@/features/accounts/hooks/use-delete-account"
import type { Account } from "@/features/accounts/types"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EditAccountDialog } from "./edit-account-dialog"
import { toast } from "sonner"

type AccountActionsProps = {
    account: Account
}

export function AccountActions({ account }: AccountActionsProps) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

    const deleteAccountMutation = useDeleteAccount()

    function handleDeleteAccount() {
        deleteAccountMutation.mutate(account.id, {
            onSuccess: () => {
                toast.success("Conta desativada com sucesso!")
                setDeleteDialogOpen(false)
            },
            onError: () => {
                toast.error("Não foi possível desativar a conta. Verifique se ela não possui transações vinculadas.")
            }
        })
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

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Desativar conta?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Essa ação não poderá ser desfeita. A conta{" "}
                            <strong>{account.name}</strong> será desativada.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {deleteAccountMutation.isError && (
                        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                            Não foi possível desativar a conta. Verifique se ela não possui
                            transações vinculadas.
                        </div>
                    )}

                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteAccountMutation.isPending}>
                            Cancelar
                        </AlertDialogCancel>

                        <AlertDialogAction
                            onClick={handleDeleteAccount}
                            disabled={deleteAccountMutation.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteAccountMutation.isPending ? "Desativando..." : "Desativar"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}