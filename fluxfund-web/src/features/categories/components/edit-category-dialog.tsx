import type { Category } from "../category-types"
import { useState } from "react"
import { useUpdateCategory } from "../hooks/use-update-category"
import type { CategoryFormData } from "../category-schema"
import { toast } from "sonner"
import { Pencil } from "lucide-react"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CategoryForm } from "./category-form"


type EditCategoryDialogProps = {
    category: Category
    categories: Category[]
}

export function EditCategoryDialog({ category, categories }: EditCategoryDialogProps) {

    const [open, setOpen] = useState(false)

    const updateCategoryMutation = useUpdateCategory()

    function handleUpdateCategory(data: CategoryFormData) {
        updateCategoryMutation.mutate(
            {
                id: category.id,
                name: data.name,
                type: data.type,
                parentId: data.parentId ?? null,
            },
            {
                onSuccess: () => {
                    toast.success("Categoria atualizada com sucesso!")
                    setOpen(false)
                },
                onError: () => {
                    toast.error("Erro ao atualizar categoria. Verifique os dados e tente novamente.")
                }
            }
        )
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

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Editar categoria</DialogTitle>
                        <DialogDescription>
                            Altere os dados da categoria selecionada.
                        </DialogDescription>
                    </DialogHeader>

                    {updateCategoryMutation.isError && (
                        <div className="mb-4 text-sm text-destructive">
                            Erro ao atualizar categoria. Verifique os dados e tente novamente.
                        </div>
                    )}

                    <CategoryForm
                        onSubmit={handleUpdateCategory}
                        defaultValues={{
                            name: category.name,
                            type: category.type,
                            parentId: category.parent?.id ?? null
                        }}
                        submitLabel="Salvar Alterações"
                        isSubmitting={updateCategoryMutation.isPending}
                        currentCategoryId={category.id}
                        categories={categories}
                    />
                </DialogContent>
            </Dialog>
        </>
    )
}