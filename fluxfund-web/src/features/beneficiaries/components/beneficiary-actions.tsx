import { MoreHorizontal, Trash2 } from "lucide-react"
import { useState } from "react"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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

type BeneficiaryActionsProps = {
    beneficiary: Beneficiary
}

export function BeneficiaryActions({ beneficiary }: BeneficiaryActionsProps) {
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

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Desativar favorecido?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Essa ação não poderá ser desfeita. O favorecido{" "}
                            <strong>{beneficiary.name}</strong> será desativado.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {deleteBeneficiaryMutation.isError && (
                        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                            Não foi possível desativar o favorecido. Verifique se ele não possui
                            transações vinculadas.
                        </div>
                    )}

                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteBeneficiaryMutation.isPending}>
                            Cancelar
                        </AlertDialogCancel>

                        <AlertDialogAction
                            onClick={handleDeleteBeneficiary}
                            disabled={deleteBeneficiaryMutation.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteBeneficiaryMutation.isPending ? "Desativando..." : "Desativar"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}