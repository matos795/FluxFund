import {
  Eye,
  MoreHorizontal,
  RotateCcw,
  UserRoundX,
} from "lucide-react"

import {
  useState,
} from "react"

import { Button } from "@/components/ui/button"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {
  ConfirmActionDialog,
} from "@/components/layout/confirm-action-dialog"

import {
  usePermissions,
} from "@/features/auth/hooks/use-permissions"

import {
  toast,
} from "sonner"

import {
  getApiErrorMessage,
} from "@/utils/api-error"

import type {
  FinancialParty,
} from "../financial-party-types"

import {
  useDeactivateFinancialParty,
} from "../hooks/use-deactivate-financial-party"

import {
  useActivateFinancialParty,
} from "../hooks/use-activate-financial-party"

import {
  EditFinancialPartyDialog,
} from "./edit-financial-party-dialog"
import { Link } from "react-router-dom"

type FinancialPartyActionsProps = {
  financialParty:
  FinancialParty
}

export function FinancialPartyActions({
  financialParty,
}: FinancialPartyActionsProps) {
  const {
    canFinanceWrite,
  } = usePermissions()

  const [
    deactivateDialogOpen,
    setDeactivateDialogOpen,
  ] = useState(false)

  const [
    activateDialogOpen,
    setActivateDialogOpen,
  ] = useState(false)

  const deactivateMutation =
    useDeactivateFinancialParty()

  const activateMutation =
    useActivateFinancialParty()

  function handleDeactivate() {
    deactivateMutation.mutate(
      financialParty.id,
      {
        onSuccess: () => {
          toast.success(
            "Contato financeiro desativado com sucesso!",
          )

          setDeactivateDialogOpen(
            false,
          )
        },

        onError: (error) => {
          toast.error(
            getApiErrorMessage(
              error,
              "Não foi possível desativar o contato financeiro.",
            ),
          )
        },
      },
    )
  }

  function handleActivate() {
    activateMutation.mutate(
      financialParty.id,
      {
        onSuccess: () => {
          toast.success(
            "Contato financeiro reativado com sucesso!",
          )

          setActivateDialogOpen(
            false,
          )
        },

        onError: (error) => {
          toast.error(
            getApiErrorMessage(
              error,
              "Não foi possível reativar o contato financeiro.",
            ),
          )
        },
      },
    )
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          asChild
        >
          <Button
            variant="ghost"
            size="icon"
          >
            <MoreHorizontal className="size-4" />

            <span className="sr-only">
              Abrir ações
            </span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
        >

          <DropdownMenuItem asChild>
            <Link to={`/financial-parties/${financialParty.id}`}>
              <Eye className="mr-2 size-4" />
              Visão 360º
            </Link>
          </DropdownMenuItem>

          {canFinanceWrite && (
            <>
              {financialParty.active ? (
                <>
                  <EditFinancialPartyDialog
                    financialParty={
                      financialParty
                    }
                  />

                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() =>
                      setDeactivateDialogOpen(
                        true,
                      )
                    }
                  >
                    <UserRoundX className="mr-2 size-4" />
                    Desativar
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem
                  onClick={() =>
                    setActivateDialogOpen(
                      true,
                    )
                  }
                >
                  <RotateCcw className="mr-2 size-4" />
                  Reativar
                </DropdownMenuItem>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmActionDialog
        open={
          deactivateDialogOpen
        }
        onOpenChange={
          setDeactivateDialogOpen
        }
        title="Desativar contato financeiro?"
        description={
          <>
            O contato{" "}
            <strong>
              {
                financialParty.name
              }
            </strong>{" "}
            deixará de aparecer nas opções de novos lançamentos. O histórico financeiro existente será preservado.
          </>
        }
        confirmLabel="Desativar"
        pendingLabel="Desativando..."
        isPending={
          deactivateMutation.isPending
        }
        isDestructive
        errorMessage={
          deactivateMutation.isError
            ? getApiErrorMessage(
              deactivateMutation.error,
              "Não foi possível desativar o contato financeiro.",
            )
            : null
        }
        onConfirm={
          handleDeactivate
        }
      />

      <ConfirmActionDialog
        open={
          activateDialogOpen
        }
        onOpenChange={
          setActivateDialogOpen
        }
        title="Reativar contato financeiro?"
        description={
          <>
            O contato{" "}
            <strong>
              {
                financialParty.name
              }
            </strong>{" "}
            voltará a ficar disponível de acordo com seus papéis financeiros.
          </>
        }
        confirmLabel="Reativar"
        pendingLabel="Reativando..."
        isPending={
          activateMutation.isPending
        }
        icon={
          <RotateCcw className="size-5" />
        }
        errorMessage={
          activateMutation.isError
            ? getApiErrorMessage(
              activateMutation.error,
              "Não foi possível reativar o contato financeiro.",
            )
            : null
        }
        onConfirm={
          handleActivate
        }
      />
    </>
  )
}