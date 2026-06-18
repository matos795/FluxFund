import type { Category } from "../category-types"
import { useState } from "react"
import { useUpdateCategory } from "../hooks/use-update-category"
import type { CategoryFormData } from "../category-schema"
import { toast } from "sonner"
import { Pencil } from "lucide-react"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Dialog } from "@/components/ui/dialog"
import { CategoryForm } from "./category-form"
import { useCategoryOptions } from "../hooks/use-category-options"
import { AppDialogBody, AppDialogContent, AppDialogHeader } from "@/components/layout/app-dialog"

type EditCategoryDialogProps = {
    category: Category
}

export function EditCategoryDialog({ category }: EditCategoryDialogProps) {

    const [open, setOpen] = useState(false)

    const updateCategoryMutation = useUpdateCategory()

    const { data: categoryOptions = [] } = useCategoryOptions()

    function handleUpdateCategory(data: CategoryFormData) {
        updateCategoryMutation.mutate(
            {
                id: category.id,
                name: data.name,
                type: data.type,
                parentId: data.parentId ?? null,
                requiresFiscalDocument: data.requiresFiscalDocument,
                requiresPaymentProof: data.requiresPaymentProof,
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
                <AppDialogContent size="md">
                    <AppDialogHeader
                        icon={<Pencil className="size-4 text-muted-foreground" />}
                        title="Editar categoria"
                        description="Altere os dados da categoria selecionada."
                    />

                    <AppDialogBody>
                        {updateCategoryMutation.isError && (
                            <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                                Erro ao atualizar categoria. Verifique os dados e tente novamente.
                            </div>
                        )}

                        <CategoryForm
                            onSubmit={handleUpdateCategory}
                            defaultValues={{
                                name: category.name,
                                type: category.type,
                                parentId: category.parent?.id ?? null,
                                requiresFiscalDocument: category.requiresFiscalDocument,
                                requiresPaymentProof: category.requiresPaymentProof,
                            }}
                            submitLabel="Salvar alterações"
                            isSubmitting={updateCategoryMutation.isPending}
                            currentCategoryId={category.id}
                            categories={categoryOptions.filter((option) => option.id !== category.id)}
                        />
                    </AppDialogBody>
                </AppDialogContent>
            </Dialog>
        </>
    )
}