import {
  useState,
} from "react"

import {
  ContactRound,
  Plus,
} from "lucide-react"

import {
  Dialog,
  DialogTrigger,
} from "@/components/ui/dialog"

import { Button } from "@/components/ui/button"

import {
  AppDialogContent,
  AppDialogHeader,
} from "@/components/layout/app-dialog"

import {
  toast,
} from "sonner"

import {
  getApiErrorMessage,
} from "@/utils/api-error"

import {
  useCreateFinancialParty,
} from "../hooks/use-create-financial-party"

import type {
  FinancialPartyFormData,
} from "../financial-party-schema"

import {
  FinancialPartyForm,
} from "./financial-party-form"

export function CreateFinancialPartyDialog() {
  const [open, setOpen] =
    useState(false)

  const createMutation =
    useCreateFinancialParty()

  function handleCreate(
    data:
      FinancialPartyFormData,
  ) {
    createMutation.mutate(
      data,
      {
        onSuccess: () => {
          toast.success(
            "Contato financeiro criado com sucesso!",
          )

          setOpen(false)
        },

        onError: (error) => {
          toast.error(
            getApiErrorMessage(
              error,
              "Não foi possível criar o contato financeiro.",
            ),
          )
        },
      },
    )
  }

  function handleOpenChange(
    nextOpen: boolean,
  ) {
    if (
      createMutation.isPending
    ) {
      return
    }

    setOpen(nextOpen)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={
        handleOpenChange
      }
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 size-4" />
          Novo contato
        </Button>
      </DialogTrigger>

      <AppDialogContent size="xl">
        <AppDialogHeader
          icon={
            <ContactRound className="size-4 text-muted-foreground" />
          }
          title="Novo contato financeiro"
          description="Cadastre uma pessoa ou empresa que traz receitas, recebe pagamentos ou exerce os dois papéis."
        />

        <FinancialPartyForm
          onSubmit={
            handleCreate
          }
          onCancel={() =>
            setOpen(false)
          }
          isSubmitting={
            createMutation.isPending
          }
        />
      </AppDialogContent>
    </Dialog>
  )
}