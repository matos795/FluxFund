import { Plus } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, } from "@/components/ui/dialog"
import { toast } from "sonner"
import { useCreateBeneficiary } from "../hooks/use-create-beneficiary"
import type { BeneficiaryFormData } from "../beneficiary-schema"
import { BeneficiaryForm } from "./beneficiary-form"

export function CreateBeneficiaryDialog() {

  const [open, setOpen] = useState(false)

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
        onSuccess: () => {
          toast.success("Favorecido criado com sucesso!")
          setOpen(false)
        },
        onError: () => {
          toast.error("Erro ao criar favorecido. Tente novamente.")
        }
      },
    )
  }

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus className="mr-2 size-4" />
        Novo favorecido
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
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