import { HandCoins, Pencil } from "lucide-react"
import { useState } from "react"

import {
  Dialog,
} from "@/components/ui/dialog"
import {
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import type { Beneficiary } from "../beneficiary-types"
import { useUpdateBeneficiary } from "../hooks/use-update-beneficiary"
import type { BeneficiaryFormData } from "../beneficiary-schema"
import { BeneficiaryForm } from "./beneficiary-form"
import { AppDialogBody, AppDialogContent, AppDialogHeader } from "@/components/layout/app-dialog"

type EditBeneficiaryDialogProps = {
  beneficiary: Beneficiary
}

export function EditBeneficiaryDialog({ beneficiary }: EditBeneficiaryDialogProps) {
  const [open, setOpen] = useState(false)

  const updateBeneficiaryMutation = useUpdateBeneficiary()

  function handleUpdateBeneficiary(data: BeneficiaryFormData) {
    updateBeneficiaryMutation.mutate(
      {
        id: beneficiary.id,
        name: data.name,
        type: data.type,
        document: data.document || undefined,
        email: data.email || undefined,
        phone: data.phone || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Favorecido atualizado com sucesso!")
          setOpen(false)
        },
        onError: () => {
          toast.error("Erro ao atualizar favorecido. Verifique os dados e tente novamente.")
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
            icon={<HandCoins className="size-4 text-muted-foreground" />}
            title="Editar favorecido"
            description="Altere os dados do favorecido selecionado."
          />

          <AppDialogBody>
            {updateBeneficiaryMutation.isError && (
              <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                Erro ao atualizar favorecido. Verifique os dados e tente novamente.
              </div>
            )}

            <BeneficiaryForm
              defaultValues={{
                name: beneficiary.name,
                type: beneficiary.type,
                document: beneficiary.document ?? "",
                email: beneficiary.email ?? "",
                phone: beneficiary.phone ?? "",
              }}
              submitLabel="Salvar alterações"
              onSubmit={handleUpdateBeneficiary}
              isSubmitting={updateBeneficiaryMutation.isPending}
            />
          </AppDialogBody>
        </AppDialogContent>
      </Dialog>
    </>
  )
}