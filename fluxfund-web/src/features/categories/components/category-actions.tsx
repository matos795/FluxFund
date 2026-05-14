import { useState } from "react"
import type { Category } from "../category-types"
import { useDeleteCategory } from "../hooks/use-delete-category"
import { toast } from "sonner"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Trash2 } from "lucide-react"
import { EditCategoryDialog } from "./edit-category-dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"


type CategoryActionsProps = {
    category: Category
    categories: Category[]
}

export function CategoryActions({ category, categories }: CategoryActionsProps) {

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

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <MoreHorizontal className="size-4" />
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">

                    <EditCategoryDialog category={category} categories={categories} />

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
                        <AlertDialogTitle>Desativar categoria?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Essa ação não poderá ser desfeita. A categoria{" "}
                            <strong>{category.name}</strong> será desativada.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {deleteCategoryMutation.isError && (
                        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                            Não foi possível desativar a categoria. Verifique se ela não possui
                            transações vinculadas.
                        </div>
                    )}

                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteCategoryMutation.isPending}>
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteCategory}
                            disabled={deleteCategoryMutation.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteCategoryMutation.isPending ? "Desativando..." : "Desativar"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}