import { Landmark, Pencil } from "lucide-react"
import { useState } from "react"

import type { AccountFormData } from "@/features/accounts/account-schema"
import { AccountForm } from "@/features/accounts/components/account-form"
import { useUpdateAccount } from "@/features/accounts/hooks/use-update-account"
import type { Account } from "@/features/accounts/types"

import {
  Dialog,
} from "@/components/ui/dialog"
import {
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { AppDialogBody, AppDialogContent, AppDialogHeader } from "@/components/layout/app-dialog"

type EditAccountDialogProps = {
  account: Account
}

export function EditAccountDialog({ account }: EditAccountDialogProps) {
  const [open, setOpen] = useState(false)

  const updateAccountMutation = useUpdateAccount()

  function handleUpdateAccount(data: AccountFormData) {
    updateAccountMutation.mutate(
      {
        id: account.id,
        name: data.name,
        type: data.type,
        bankCode: data.bankCode || undefined,
        bankName: data.bankName || undefined,
        agency: data.agency || undefined,
        accountNumber: data.accountNumber || undefined,
        initialBalance: data.initialBalance,
        initialBalanceDate: data.initialBalanceDate,
        active: data.active,
      },
      {
        onSuccess: () => {
          toast.success("Conta atualizada com sucesso!")
          setOpen(false)
        },
        onError: () => {
          toast.error("Erro ao atualizar conta. Verifique os dados e tente novamente.")
        }
      },
    )
  }

  return (
    <>
      <DropdownMenuItem
        onSelect={(event) => {
          event.preventDefault()
          setOpen(true)
        }}
      >
        <Pencil className="mr-2 size-4" />
        Editar
      </DropdownMenuItem>

      <Dialog open={open} onOpenChange={setOpen}>
        <AppDialogContent size="md">
          <AppDialogHeader
            icon={<Landmark className="size-4 text-muted-foreground" />}
            title="Editar conta"
            description="Altere os dados da conta selecionada."
          />

          <AppDialogBody>
            {updateAccountMutation.isError && (
              <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                Erro ao atualizar conta. Verifique os dados e tente novamente.
              </div>
            )}

            <AccountForm
              defaultValues={{
                name: account.name,
                type: account.type,
                bankCode: account.bankCode ?? "",
                bankName: account.bankName ?? "",
                agency: account.agency ?? "",
                accountNumber: account.accountNumber ?? "",
                initialBalance: account.initialBalance,
                initialBalanceDate:
                  account.initialBalanceDate ??
                  new Date().toISOString().slice(0, 10),
                active: account.active,
              }}
              submitLabel="Salvar alterações"
              onSubmit={handleUpdateAccount}
              isSubmitting={updateAccountMutation.isPending}
            />
          </AppDialogBody>
        </AppDialogContent>
      </Dialog>
    </>
  )
}