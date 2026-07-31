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

import {
  Button,
} from "@/components/ui/button"

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

import type {
  FinancialParty,
  FinancialPartyRole,
} from "../financial-party-types"

import {
  FinancialPartyForm,
} from "./financial-party-form"

type CreateFinancialPartyDialogProps = {
  open?: boolean
  onOpenChange?: (
    open: boolean,
  ) => void
  requiredRole?: FinancialPartyRole
  onCreated?: (
    financialParty:
      FinancialParty,
  ) => void
  showTrigger?: boolean
}

export function CreateFinancialPartyDialog({
  open: controlledOpen,
  onOpenChange,
  requiredRole,
  onCreated,
  showTrigger = true,
}: CreateFinancialPartyDialogProps) {
  const [
    internalOpen,
    setInternalOpen,
  ] = useState(false)

  const createMutation =
    useCreateFinancialParty()

  const open =
    controlledOpen ??
    internalOpen

  const isIncomeSource =
    requiredRole ===
    "INCOME_SOURCE"

  const isPaymentRecipient =
    requiredRole ===
    "PAYMENT_RECIPIENT"

  function updateOpen(
    nextOpen: boolean,
  ) {
    if (
      controlledOpen ===
      undefined
    ) {
      setInternalOpen(
        nextOpen,
      )
    }

    onOpenChange?.(
      nextOpen,
    )
  }

  function handleCreate(
    data:
      FinancialPartyFormData,
  ) {
    createMutation.mutate(
      data,
      {
        onSuccess: (
          financialParty,
        ) => {
          toast.success(
            "Contato financeiro criado com sucesso!",
          )
          onCreated?.(
            financialParty,
          )

          updateOpen(false)
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

    updateOpen(nextOpen)
  }

  const title =
    isIncomeSource
      ? "Nova origem de receita"
      : isPaymentRecipient
        ? "Novo recebedor de pagamento"
        : "Novo contato financeiro"

  const description =
    isIncomeSource
      ? "Cadastre a pessoa ou empresa que enviou ou poderá enviar recursos para a organização."
      : isPaymentRecipient
        ? "Cadastre a pessoa ou empresa que poderá receber pagamentos, repasses ou reembolsos."
        : "Cadastre uma pessoa ou empresa que traz receitas, recebe pagamentos ou exerce os dois papéis."

  return (
    <Dialog
      open={open}
      onOpenChange={
        handleOpenChange
      }
    >
      {showTrigger && (
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 size-4" />
            Novo contato
          </Button>
        </DialogTrigger>
      )}

      <AppDialogContent size="xl">
        <AppDialogHeader
          icon={
            <ContactRound className="size-4 text-muted-foreground" />
          }
          title={
            title
          }
          description={
            description
          }
        />

        <FinancialPartyForm
          key={
            requiredRole ??
            "GENERAL"
          }
          defaultValues={{
            roles:
              requiredRole
                ? [requiredRole]
                : [],
          }}
          requiredRole={
            requiredRole
          }
          onSubmit={
            handleCreate
          }
          onCancel={() =>
            updateOpen(false)
          }
          isSubmitting={
            createMutation.isPending
          }
        />
      </AppDialogContent>
    </Dialog>
  )
}