import { Plus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useCreateSupportAgreement } from "../hooks/use-create-support-agreement"
import type { SupportAgreementFormData } from "../support-agreement-schema"
import { SupportAgreementForm } from "./support-agreement-form"

type CreateSupportAgreementDialogProps = {
  beneficiaryId?: string
  beneficiaryName?: string
}

export function CreateSupportAgreementDialog({
  beneficiaryId,
  beneficiaryName,
}: CreateSupportAgreementDialogProps) {
  const [open, setOpen] = useState(false)

  const createSupportAgreementMutation = useCreateSupportAgreement()

  function handleCreate(data: SupportAgreementFormData) {
    createSupportAgreementMutation.mutate(
      {
        beneficiaryId: data.beneficiaryId,
        fundId: data.fundId,
        amount: data.amount,
        startDate: data.startDate,
        endDate: data.endDate || null,
        description: data.description || null,
      },
      {
        onSuccess: () => {
          toast.success("Compromisso criado com sucesso.")
          setOpen(false)
        },
        onError: () => {
          toast.error("Não foi possível criar o compromisso.")
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {beneficiaryId ? (
          <Button variant="outline" size="sm">
            <Plus className="mr-2 size-4" />
            Novo compromisso
          </Button>
        ) : (
          <Button>
            <Plus className="mr-2 size-4" />
            Novo compromisso
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Novo compromisso de sustento</DialogTitle>
          <DialogDescription>
            {beneficiaryName
              ? `Cadastre um compromisso para ${beneficiaryName}.`
              : "Cadastre um compromisso fixo entre a organização, um favorecido e um fundo."}
          </DialogDescription>
        </DialogHeader>

        <SupportAgreementForm
          defaultValues={{
            beneficiaryId: beneficiaryId ?? "",
            active: true,
          }}
          lockBeneficiary={Boolean(beneficiaryId)}
          isSubmitting={createSupportAgreementMutation.isPending}
          onSubmit={handleCreate}
        />
      </DialogContent>
    </Dialog>
  )
}