import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogTrigger, } from "@/components/ui/dialog"
import { toast } from "sonner"
import { useCreateBeneficiary } from "../hooks/use-create-beneficiary"
import type { BeneficiaryFormData } from "../beneficiary-schema"
import { BeneficiaryForm } from "./beneficiary-form"
import { AppDialogBody, AppDialogContent, AppDialogHeader } from "@/components/layout/app-dialog"
import { HandCoins } from "lucide-react"

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
        <AppDialogContent size="md">
          <AppDialogHeader
            icon={<HandCoins className="size-4 text-muted-foreground" />}
            title="Novo favorecido"
            description="Cadastre pessoas, ministérios, fornecedores ou entidades que recebem recursos."
          />

          <AppDialogBody>
            <BeneficiaryForm
              onSubmit={handleCreateBeneficiary}
              isSubmitting={createBeneficiaryMutation.isPending}
            />
          </AppDialogBody>
        </AppDialogContent>
      </Dialog>
    </>
  )
}