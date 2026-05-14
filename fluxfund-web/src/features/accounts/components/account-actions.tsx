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

type AccountActionsProps = {
  account: Account
}

export function AccountActions({ account }: AccountActionsProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const deleteAccountMutation = useDeleteAccount()

  function handleDeleteAccount() {
    deleteAccountMutation.mutate(account.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false)
      },
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
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 size-4" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conta?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não poderá ser desfeita. A conta{" "}
              <strong>{account.name}</strong> será removida do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {deleteAccountMutation.isError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              Não foi possível excluir a conta. Verifique se ela não possui
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
              {deleteAccountMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}