import { MoreHorizontal, Trash2 } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import type { Beneficiary } from "../beneficiary-types"
import { useDeleteBeneficiary } from "../hooks/use-delete-beneficiary"
import { EditBeneficiaryDialog } from "./edit-beneficiary-dialog"
import { CreateSupportAgreementDialog } from "@/features/support-agreements/components/create-support-agreement-dialog"
import { usePermissions } from "@/features/auth/hooks/use-permissions"
import { ConfirmActionDialog } from "@/components/layout/confirm-action-dialog"

type BeneficiaryActionsProps = {
    beneficiary: Beneficiary
}

export function BeneficiaryActions({ beneficiary }: BeneficiaryActionsProps) {

    const { canFinanceWrite } = usePermissions()

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

    const deleteBeneficiaryMutation = useDeleteBeneficiary()

    function handleDeleteBeneficiary() {
        deleteBeneficiaryMutation.mutate(beneficiary.id, {
            onSuccess: () => {
                toast.success("Favorecido desativado com sucesso!")
                setDeleteDialogOpen(false)
            },
            onError: () => {
                toast.error("Não foi possível desativar o favorecido. Verifique se ele não possui transações vinculadas.")
            }
        })
    }

    if (!canFinanceWrite) {
        return null
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <MoreHorizontal className="size-4" />
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                    <EditBeneficiaryDialog beneficiary={beneficiary} />
                    <CreateSupportAgreementDialog
                        beneficiaryId={beneficiary.id}
                        beneficiaryName={beneficiary.name}
                    />
                    <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeleteDialogOpen(true)}
                    >
                        <Trash2 className="mr-2 size-4" />
                        Desativar
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <ConfirmActionDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Desativar favorecido?"
                description={
                    <>
                        Essa ação não poderá ser desfeita. O favorecido{" "}
                        <strong>{beneficiary.name}</strong> será desativado.
                    </>
                }
                confirmLabel="Desativar"
                pendingLabel="Desativando..."
                isPending={deleteBeneficiaryMutation.isPending}
                isDestructive
                errorMessage={
                    deleteBeneficiaryMutation.isError
                        ? "Não foi possível desativar o favorecido. Verifique se ele não possui transações vinculadas."
                        : null
                }
                onConfirm={handleDeleteBeneficiary}
            />
        </>
    )
}