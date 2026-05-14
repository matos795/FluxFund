import { Pencil } from "lucide-react"
import { useState } from "react"

import type { AccountFormData } from "@/features/accounts/account-schema"
import { AccountForm } from "@/features/accounts/components/account-form"
import { useUpdateAccount } from "@/features/accounts/hooks/use-update-account"
import type { Account } from "@/features/accounts/types"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

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
          setOpen(false)
        },
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
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar conta</DialogTitle>
            <DialogDescription>
              Altere os dados da conta selecionada.
            </DialogDescription>
          </DialogHeader>

          {updateAccountMutation.isError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              Não foi possível atualizar a conta. Verifique os dados e tente novamente.
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
        </DialogContent>
      </Dialog>
    </>
  )
}