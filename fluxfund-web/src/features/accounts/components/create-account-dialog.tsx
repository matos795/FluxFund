import { useState } from "react"

import type { AccountFormData } from "@/features/accounts/account-schema"
import { AccountForm } from "@/features/accounts/components/account-form"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, } from "@/components/ui/dialog"
import { useCreateAccount } from "../hooks/use-create-account"
import { toast } from "sonner"

type CreateAccountDialogProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onCreated?: (accountId: string) => void
}

export function CreateAccountDialog({
  open: controlledOpen,
  onOpenChange,
  onCreated
}: CreateAccountDialogProps) {

  const [internalOpen, setInternalOpen] = useState(false)

  const open = controlledOpen ?? internalOpen

  function handleOpenChange(value: boolean) {
    if (onOpenChange) {
      onOpenChange(value)
      return
    }

    setInternalOpen(value)
  }

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
        onSuccess: (account) => {
          toast.success("Conta criada com sucesso!")
          onCreated?.(account.id)
          handleOpenChange(false)
        },
        onError: () => {
          toast.error("Erro ao criar conta. Tente novamente.")
        }
      },
    )
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        {controlledOpen === undefined && (
          <DialogTrigger asChild>
            <Button>Nova conta</Button>
          </DialogTrigger>
        )}
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