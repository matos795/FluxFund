import { useState } from "react"
import type { Fund } from "../fund-types"
import { useDeleteFund } from "../hooks/use-delete-fund"
import { toast } from "sonner"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Trash2 } from "lucide-react"
import { EditFundDialog } from "./edit-fund-dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

type FundActionsProps = {
    fund: Fund
}

export function FundActions({ fund }: FundActionsProps) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

    const deleteFundMutation = useDeleteFund()

    function handleDeleteFund() {
        deleteFundMutation.mutate(fund.id, {
            onSuccess: () => {
                toast.success("Fundo desativado com sucesso!")
                setDeleteDialogOpen(false)
            },
            onError: () => {
                toast.error("Não foi possível desativar o fundo. Verifique se ele não possui transações vinculadas.")
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
                    <EditFundDialog fund={fund} />
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
                        <AlertDialogTitle>Desativar fundo?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Essa ação não poderá ser desfeita. O fundo{" "}
                            <strong>{fund.name}</strong> será desativado.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {deleteFundMutation.isError && (
                        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                            Não foi possível desativar o fundo. Verifique se ele não possui
                            transações vinculadas.
                        </div>
                    )}

                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteFundMutation.isPending}>
                            Cancelar
                        </AlertDialogCancel>

                        <AlertDialogAction
                            onClick={handleDeleteFund}
                            disabled={deleteFundMutation.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteFundMutation.isPending ? "Desativando..." : "Desativar"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}