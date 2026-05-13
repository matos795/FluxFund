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

type CreateAccountDialogProps = {
  onCreate: (data: AccountFormData) => void
}

export function CreateAccountDialog({ onCreate }: CreateAccountDialogProps) {
  const [open, setOpen] = useState(false)

  function handleCreateAccount(data: AccountFormData) {
    onCreate(data)
    setOpen(false)
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

          <AccountForm onSubmit={handleCreateAccount} />
        </DialogContent>
      </Dialog>
    </>
  )
}