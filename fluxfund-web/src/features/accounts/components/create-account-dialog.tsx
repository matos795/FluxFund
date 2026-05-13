import { Plus } from "lucide-react"
import { useState } from "react"

import type { AccountFormData } from "@/features/accounts/account-schema"
import { AccountForm } from "@/features/accounts/components/account-form"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useCreateAccount } from "../hooks/use-create-account"

export function CreateAccountDialog() {
  
  const [open, setOpen] = useState(false)

  const createAccountMutation = useCreateAccount()

  function handleCreateAccount(data: AccountFormData) {
    createAccountMutation.mutate(
      {
        name: data.name,
        type: data.type,
        bankCode: data.bankCode || undefined,
        bankName: data.bankName || undefined,
        agency: data.agency || undefined,
        accountNumber: data.accountNumber || undefined,
        initialBalance: data.initialBalance,
        initialBalanceDate: data.initialBalanceDate,
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
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus className="mr-2 size-4" />
        Nova conta
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova conta</DialogTitle>
            <DialogDescription>
              Cadastre uma conta bancária, caixa físico, carteira ou conta digital.
            </DialogDescription>
          </DialogHeader>

          <AccountForm onSubmit={handleCreateAccount} isSubmitting={createAccountMutation.isPending} />
        </DialogContent>
      </Dialog>
    </>
  )
}