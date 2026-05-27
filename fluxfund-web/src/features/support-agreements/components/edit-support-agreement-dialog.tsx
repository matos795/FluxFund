import { Pencil } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { useUpdateSupportAgreement } from "../hooks/use-update-support-agreement"
import type { SupportAgreement } from "../support-agreement-types"
import type { SupportAgreementFormData } from "../support-agreement-schema"
import { SupportAgreementForm } from "./support-agreement-form"

type EditSupportAgreementDialogProps = {
  agreement: SupportAgreement
}

export function EditSupportAgreementDialog({
  agreement,
}: EditSupportAgreementDialogProps) {
  const [open, setOpen] = useState(false)

  const updateSupportAgreementMutation = useUpdateSupportAgreement()

  function handleUpdate(data: SupportAgreementFormData) {
    updateSupportAgreementMutation.mutate(
      {
        id: agreement.id,
        data: {
          beneficiaryId: data.beneficiaryId,
          fundId: data.fundId,
          amount: data.amount,
          startDate: data.startDate,
          endDate: data.endDate || null,
          active: data.active,
          description: data.description || null,
        },
      },
      {
        onSuccess: () => {
          toast.success("Compromisso atualizado com sucesso.")
          setOpen(false)
        },
        onError: () => {
          toast.error("Não foi possível atualizar o compromisso.")
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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar compromisso</DialogTitle>
            <DialogDescription>
              Atualize as informações do compromisso de sustento.
            </DialogDescription>
          </DialogHeader>

          <SupportAgreementForm
            defaultValues={{
              beneficiaryId: agreement.beneficiary.id,
              fundId: agreement.fund.id,
              amount: agreement.amount,
              startDate: agreement.startDate,
              endDate: agreement.endDate ?? "",
              active: agreement.active,
              description: agreement.description ?? "",
            }}
            submitLabel="Salvar alterações"
            isSubmitting={updateSupportAgreementMutation.isPending}
            onSubmit={handleUpdate}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}