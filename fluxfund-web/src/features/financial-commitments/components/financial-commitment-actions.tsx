import {
    CalendarX2,
    MoreHorizontal,
    RotateCcw,
} from "lucide-react"

import {
    useState,
} from "react"

import {
    toast,
} from "sonner"

import {
    Button,
} from "@/components/ui/button"

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
    getApiErrorMessage,
} from "@/utils/api-error"

import type {
    FinancialCommitment,
} from "../financial-commitment-types"

import {
    useDeactivateFinancialCommitment,
} from "../hooks/use-deactivate-financial-commitment"

import {
    useActivateFinancialCommitment,
} from "../hooks/use-activate-financial-commitment"

import {
    EditFinancialCommitmentDialog,
} from "./edit-financial-commitment-dialog"

type FinancialCommitmentActionsProps = {
    commitment:
    FinancialCommitment
}

export function FinancialCommitmentActions({
    commitment,
}: FinancialCommitmentActionsProps) {
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
        useDeactivateFinancialCommitment()

    const activateMutation =
        useActivateFinancialCommitment()

    function handleDeactivate() {
        deactivateMutation.mutate(
            commitment.id,
            {
                onSuccess: () => {
                    toast.success(
                        "Compromisso financeiro desativado com sucesso.",
                    )

                    setDeactivateDialogOpen(
                        false,
                    )
                },

                onError: (error) => {
                    toast.error(
                        getApiErrorMessage(
                            error,
                            "Não foi possível desativar o compromisso financeiro.",
                        ),
                    )
                },
            },
        )
    }

    function handleActivate() {
        activateMutation.mutate(
            commitment.id,
            {
                onSuccess: () => {
                    toast.success(
                        "Compromisso financeiro reativado com sucesso.",
                    )

                    setActivateDialogOpen(
                        false,
                    )
                },

                onError: (error) => {
                    toast.error(
                        getApiErrorMessage(
                            error,
                            "Não foi possível reativar o compromisso financeiro.",
                        ),
                    )
                },
            },
        )
    }

    if (!canFinanceWrite) {
        return null
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                    >
                        <MoreHorizontal className="size-4" />

                        <span className="sr-only">
                            Abrir ações do compromisso
                        </span>
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                    align="end"
                >
                    {/*
           * Editar fica disponível até para
           * compromissos desativados.
           *
           * Isso é necessário porque um
           * compromisso encerrado pode precisar
           * ter sua vigência corrigida antes
           * de ser reativado.
           */}
                    <EditFinancialCommitmentDialog
                        commitment={
                            commitment
                        }
                    />

                    {commitment.active ? (
                        <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() =>
                                setDeactivateDialogOpen(
                                    true,
                                )
                            }
                        >
                            <CalendarX2 className="mr-2 size-4" />
                            Desativar
                        </DropdownMenuItem>
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
                </DropdownMenuContent>
            </DropdownMenu>

            <ConfirmActionDialog
                open={
                    deactivateDialogOpen
                }
                onOpenChange={
                    setDeactivateDialogOpen
                }
                title="Desativar compromisso financeiro?"
                description={
                    <>
                        O compromisso de{" "}
                        <strong>
                            {
                                commitment.party.name
                            }
                        </strong>{" "}
                        deixará de ser considerado em novas sugestões e previsões. O histórico já registrado será preservado.
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
                            "Não foi possível desativar o compromisso financeiro.",
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
                title="Reativar compromisso financeiro?"
                description={
                    <>
                        O compromisso de{" "}
                        <strong>
                            {
                                commitment.party.name
                            }
                        </strong>{" "}
                        voltará a ser considerado nas sugestões e previsões financeiras.
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
                            "Não foi possível reativar o compromisso financeiro.",
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