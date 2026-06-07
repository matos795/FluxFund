import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, } from "@/components/ui/dialog"
import { toast } from "sonner"
import { useCreateBeneficiary } from "../hooks/use-create-beneficiary"
import type { BeneficiaryFormData } from "../beneficiary-schema"
import { BeneficiaryForm } from "./beneficiary-form"

type CreateBeneficiaryDialogProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onCreated?: (beneficiaryId: string) => void
}

export function CreateBeneficiaryDialog({
  open: controlledOpen,
  onOpenChange,
  onCreated,
}: CreateBeneficiaryDialogProps) {

  const [internalOpen, setInternalOpen] = useState(false)

  const open = controlledOpen ?? internalOpen

  function handleOpenChange(value: boolean) {
    if (onOpenChange) {
      onOpenChange(value)
      return
    }

    setInternalOpen(value)
  }

  const createBeneficiaryMutation = useCreateBeneficiary()

  function handleCreateBeneficiary(data: BeneficiaryFormData) {
    createBeneficiaryMutation.mutate(
      {
        name: data.name,
        type: data.type,
        document: data.document || undefined,
        email: data.email || undefined,
        phone: data.phone || undefined
      },
      {
        onSuccess: (beneficiary) => {
          toast.success("Favorecido criado com sucesso!")

          onCreated?.(beneficiary.id)

          handleOpenChange(false)
        },
        onError: () => {
          toast.error("Erro ao criar favorecido. Tente novamente.")
        }
      },
    )
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        {controlledOpen === undefined && (
          <DialogTrigger asChild>
            <Button>Novo favorecido</Button>
          </DialogTrigger>
        )}
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo favorecido</DialogTitle>
            <DialogDescription>
              Cadastre uma pessoa, fornecedor, funcionário ou responsável vinculado às movimentações financeiras.
            </DialogDescription>
          </DialogHeader>

          <BeneficiaryForm onSubmit={handleCreateBeneficiary} isSubmitting={createBeneficiaryMutation.isPending} />
        </DialogContent>
      </Dialog>
    </>
  )
}