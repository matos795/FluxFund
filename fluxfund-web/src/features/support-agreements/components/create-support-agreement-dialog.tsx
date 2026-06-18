import { Plus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useCreateSupportAgreement } from "../hooks/use-create-support-agreement"
import type { SupportAgreementFormData } from "../support-agreement-schema"
import { SupportAgreementForm } from "./support-agreement-form"
import { AppDialogBody, AppDialogContent, AppDialogHeader } from "@/components/layout/app-dialog"

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

      <AppDialogContent size="lg">
        <AppDialogHeader
          icon={<Plus className="size-4 text-muted-foreground" />}
          title="Novo compromisso de sustento"
          description={
            beneficiaryName
              ? `Cadastre um compromisso para ${beneficiaryName}.`
              : "Cadastre um compromisso fixo entre a organização, um favorecido e um fundo."
          }
        />

        <AppDialogBody>
          <SupportAgreementForm
            defaultValues={{
              beneficiaryId: beneficiaryId ?? "",
              active: true,
            }}
            lockBeneficiary={Boolean(beneficiaryId)}
            isSubmitting={createSupportAgreementMutation.isPending}
            onSubmit={handleCreate}
          />
        </AppDialogBody>
      </AppDialogContent>
    </Dialog>
  )
}