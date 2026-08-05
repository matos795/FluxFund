import {
  useState,
} from "react"

import {
  ContactRound,
  Pencil,
} from "lucide-react"

import {
  Dialog,
} from "@/components/ui/dialog"

import {
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

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

import type {
  FinancialParty,
} from "../financial-party-types"

import type {
  FinancialPartyFormData,
} from "../financial-party-schema"

import {
  useUpdateFinancialParty,
} from "../hooks/use-update-financial-party"

import {
  FinancialPartyForm,
} from "./financial-party-form"

type EditFinancialPartyDialogProps = {
  financialParty:
    FinancialParty
}

export function EditFinancialPartyDialog({
  financialParty,
}: EditFinancialPartyDialogProps) {
  const [open, setOpen] =
    useState(false)

  const updateMutation =
    useUpdateFinancialParty()

  function handleUpdate(
    data:
      FinancialPartyFormData,
  ) {
    updateMutation.mutate(
      {
        id:
          financialParty.id,

        ...data,
      },
      {
        onSuccess: () => {
          toast.success(
            "Contato financeiro atualizado com sucesso!",
          )

          setOpen(false)
        },

        onError: (error) => {
          toast.error(
            getApiErrorMessage(
              error,
              "Não foi possível atualizar o contato financeiro.",
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
      updateMutation.isPending
    ) {
      return
    }

    setOpen(nextOpen)
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

      <Dialog
        open={open}
        onOpenChange={
          handleOpenChange
        }
      >
        <AppDialogContent size="xl">
          <AppDialogHeader
            icon={
              <ContactRound className="size-4 text-muted-foreground" />
            }
            title="Editar contato financeiro"
            description={`Altere os dados de ${financialParty.name}.`}
          />

          <FinancialPartyForm
            defaultValues={{
              name:
                financialParty.name,

              partyType:
                financialParty.partyType,

              type:
                financialParty.type,

              roles:
                financialParty.roles,

              document:
                financialParty.document ??
                "",

              email:
                financialParty.email ??
                "",

              phone:
                financialParty.phone ??
                "",

              legalName:
                financialParty.legalName ??
                "",

              contactPerson:
                financialParty.contactPerson ??
                "",

              addressLine:
                financialParty.addressLine ??
                "",

              addressNumber:
                financialParty.addressNumber ??
                "",

              addressComplement:
                financialParty.addressComplement ??
                "",

              neighborhood:
                financialParty.neighborhood ??
                "",

              city:
                financialParty.city ??
                "",

              state:
                financialParty.state ??
                "",

              zipCode:
                financialParty.zipCode ??
                "",

              notes:
                financialParty.notes ??
                "",
            }}
            submitLabel="Salvar alterações"
            onSubmit={
              handleUpdate
            }
            onCancel={() =>
              setOpen(false)
            }
            isSubmitting={
              updateMutation.isPending
            }
          />
        </AppDialogContent>
      </Dialog>
    </>
  )
}