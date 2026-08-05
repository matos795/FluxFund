import {
  useState,
} from "react"

import {
  CalendarClock,
  Plus,
} from "lucide-react"

import {
  toast,
} from "sonner"

import {
  Dialog,
  DialogTrigger,
} from "@/components/ui/dialog"

import {
  Button,
} from "@/components/ui/button"

import {
  AppDialogContent,
  AppDialogHeader,
} from "@/components/layout/app-dialog"

import {
  getApiErrorMessage,
} from "@/utils/api-error"

import {
  useCreateFinancialCommitment,
} from "../hooks/use-create-financial-commitment"

import type {
  FinancialCommitmentFormData,
} from "../financial-commitment-schema"

import {
  FinancialCommitmentForm,
} from "./financial-commitment-form"

export function CreateFinancialCommitmentDialog() {
  const [open, setOpen] =
    useState(false)

  const mutation =
    useCreateFinancialCommitment()

  function handleSubmit(
    data:
      FinancialCommitmentFormData,
  ) {
    mutation.mutate(
      data,
      {
        onSuccess: () => {
          toast.success(
            "Compromisso financeiro criado com sucesso.",
          )

          setOpen(false)
        },

        onError: (error) => {
          toast.error(
            getApiErrorMessage(
              error,
              "Não foi possível criar o compromisso.",
            ),
          )
        },
      },
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (
          !mutation.isPending
        ) {
          setOpen(value)
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 size-4" />
          Novo compromisso
        </Button>
      </DialogTrigger>

      <AppDialogContent size="xl">
        <AppDialogHeader
          icon={
            <CalendarClock className="size-4 text-muted-foreground" />
          }
          title="Novo compromisso financeiro"
          description="Cadastre um valor previsto a receber ou a pagar."
        />

        <FinancialCommitmentForm
          onSubmit={
            handleSubmit
          }
          onCancel={() =>
            setOpen(false)
          }
          isSubmitting={
            mutation.isPending
          }
        />
      </AppDialogContent>
    </Dialog>
  )
}