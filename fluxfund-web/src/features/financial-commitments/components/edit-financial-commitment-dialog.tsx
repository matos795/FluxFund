import {
  useState,
} from "react"

import {
  CalendarClock,
  Pencil,
} from "lucide-react"

import {
  toast,
} from "sonner"

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
  getApiErrorMessage,
} from "@/utils/api-error"

import type {
  FinancialCommitment,
} from "../financial-commitment-types"

import type {
  FinancialCommitmentFormData,
} from "../financial-commitment-schema"

import {
  useUpdateFinancialCommitment,
} from "../hooks/use-update-financial-commitment"

import {
  FinancialCommitmentForm,
} from "./financial-commitment-form"

type EditFinancialCommitmentDialogProps = {
  commitment:
    FinancialCommitment
}

export function EditFinancialCommitmentDialog({
  commitment,
}: EditFinancialCommitmentDialogProps) {
  const [open, setOpen] =
    useState(false)

  const updateMutation =
    useUpdateFinancialCommitment()

  function handleUpdate(
    data:
      FinancialCommitmentFormData,
  ) {
    updateMutation.mutate(
      {
        id:
          commitment.id,

        data,
      },
      {
        onSuccess: () => {
          toast.success(
            "Compromisso financeiro atualizado com sucesso.",
          )

          setOpen(false)
        },

        onError: (error) => {
          toast.error(
            getApiErrorMessage(
              error,
              "Não foi possível atualizar o compromisso financeiro.",
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
          /*
           * Impede o fechamento do menu
           * de desmontar o diálogo antes
           * de sua abertura.
           */
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
              <CalendarClock className="size-4 text-muted-foreground" />
            }
            title="Editar compromisso financeiro"
            description={`Altere valor, vigência e destinação do compromisso de ${commitment.party.name}.`}
          />

          <FinancialCommitmentForm
            /*
             * Recria o estado do formulário
             * quando a tabela recebe a versão
             * atualizada do compromisso.
             */
            key={[
              commitment.id,
              commitment.updatedAt ??
                commitment.createdAt,
            ].join("-")}
            defaultValues={{
              partyId:
                commitment.party.id,

              designatedRecipientId:
                commitment
                  .designatedRecipient
                  ?.id ?? "",

              fundId:
                commitment.fund.id,

              direction:
                commitment.direction,

              commitmentType:
                commitment.commitmentType,

              recurrence:
                commitment.recurrence,

              amount:
                commitment.amount,

              dueDay:
                commitment.dueDay
                  ? String(
                      commitment.dueDay,
                    )
                  : "",

              startDate:
                commitment.startDate,

              endDate:
                commitment.endDate ??
                "",

              description:
                commitment.description ??
                "",
            }}
            /*
             * Direção e tipo definem a natureza
             * histórica do compromisso.
             *
             * Para alterá-los, deve-se encerrar
             * o compromisso e criar outro.
             */
            lockDefinition
            submitLabel="Salvar alterações"
            isSubmitting={
              updateMutation.isPending
            }
            onSubmit={
              handleUpdate
            }
            onCancel={() =>
              setOpen(false)
            }
          />
        </AppDialogContent>
      </Dialog>
    </>
  )
}