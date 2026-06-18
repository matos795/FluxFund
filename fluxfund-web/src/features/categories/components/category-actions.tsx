import { useState } from "react"
import type { Category } from "../category-types"
import { useDeleteCategory } from "../hooks/use-delete-category"
import { toast } from "sonner"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Trash2 } from "lucide-react"
import { EditCategoryDialog } from "./edit-category-dialog"
import { usePermissions } from "@/features/auth/hooks/use-permissions"
import { ConfirmActionDialog } from "@/components/layout/confirm-action-dialog"


type CategoryActionsProps = {
    category: Category
}

export function CategoryActions({ category }: CategoryActionsProps) {

    const { canFinanceWrite } = usePermissions()

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

    const deleteCategoryMutation = useDeleteCategory()

    function handleDeleteCategory() {
        deleteCategoryMutation.mutate(category.id, {
            onSuccess: () => {
                toast.success("Categoria desativada com sucesso!")
                setDeleteDialogOpen(false)
            },
            onError: () => {
                toast.error("Não foi possível desativar a categoria. Verifique se ela não possui transações vinculadas.")
            },
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

                    <EditCategoryDialog category={category} />

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
                title="Desativar categoria?"
                description={
                    <>
                        Essa ação não poderá ser desfeita. A categoria{" "}
                        <strong>{category.name}</strong> será desativada.
                    </>
                }
                confirmLabel="Desativar"
                pendingLabel="Desativando..."
                isPending={deleteCategoryMutation.isPending}
                isDestructive
                errorMessage={
                    deleteCategoryMutation.isError
                        ? "Não foi possível desativar a categoria. Verifique se ela não possui transações vinculadas."
                        : null
                }
                onConfirm={handleDeleteCategory}
            />
        </>
    )
}