import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, } from "@/components/ui/dialog"
import { toast } from "sonner"
import { useCreateFund } from "../hooks/use-create-fund"
import type { FundFormData } from "../fund-schema"
import { FundForm } from "./fund-form"

type CreateFundDialogProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onCreated?: (fundId: string) => void
}

export function CreateFundDialog({ open: controlledOpen, onOpenChange, onCreated }: CreateFundDialogProps) {

  const [internalOpen, setInternalOpen] = useState(false)

  const open = controlledOpen ?? internalOpen

  function handleOpenChange(value: boolean) {
    if (onOpenChange) {
      onOpenChange(value)
      return
    }

    setInternalOpen(value)
  }

  const createFundMutation = useCreateFund()

  function handleCreateFund(data: FundFormData) {
    createFundMutation.mutate(
      {
        name: data.name,
        description: data.description || undefined,
        initialBalance: data.initialBalance,
        initialBalanceDate: data.initialBalanceDate || undefined,
      },
      {
        onSuccess: (fund) => {
          toast.success("Fundo criado com sucesso!")
          onCreated?.(fund.id)
          handleOpenChange(false)
        },
        onError: () => {
          toast.error("Erro ao criar fundo. Tente novamente.")
        }
      },
    )
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        {controlledOpen === undefined && (
          <DialogTrigger asChild>
            <Button>Novo fundo</Button>
          </DialogTrigger>
        )}
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo fundo</DialogTitle>
            <DialogDescription>
              Cadastre uma destinação interna para controlar recursos de projetos, áreas ou finalidades específicas.
            </DialogDescription>
          </DialogHeader>

          <FundForm onSubmit={handleCreateFund} isSubmitting={createFundMutation.isPending} />
        </DialogContent>
      </Dialog>
    </>
  )
}