import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CategoryForm } from "./category-form";
import { useState } from "react";
import type { CategoryFormData } from "../category-schema";
import { useCreateCategory } from "../hooks/use-create-category";
import { toast } from "sonner";
import { useCategoryOptions } from "../hooks/use-category-options";

type CreateCategoryDialogProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onCreated?: (categoryId: string) => void
}

export function CreateCategoryDialog({
  open: controlledOpen,
  onOpenChange,
  onCreated,
}: CreateCategoryDialogProps) {

  const [internalOpen, setInternalOpen] = useState(false)

  const open = controlledOpen ?? internalOpen

  function handleOpenChange(value: boolean) {
    if (onOpenChange) {
      onOpenChange(value)
      return
    }

    setInternalOpen(value)
  }

  const createCategoryMutation = useCreateCategory()

  const { data: categoryOptions = [] } = useCategoryOptions()

  function handleCreateCategory(data: CategoryFormData) {
    createCategoryMutation.mutate(
      {
        name: data.name,
        type: data.type,
        parentId: data.parentId ?? null,
      },
      {
        onSuccess: (category) => {
          toast.success("Categoria criada com sucesso!")

          onCreated?.(category.id)

          handleOpenChange(false)
        },
        onError: () => {
          toast.error("Erro ao criar categoria. Tente novamente.")
        }
      },
    )
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>

        {controlledOpen === undefined && (
          <DialogTrigger asChild>
            <Button>Nova categoria</Button>
          </DialogTrigger>
        )}
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova categoria</DialogTitle>
            <DialogDescription>
              Cadastre uma nova categoria para organizar suas receitas e despesas.
            </DialogDescription>
          </DialogHeader>

          <CategoryForm
            onSubmit={handleCreateCategory}
            isSubmitting={createCategoryMutation.isPending}
            categories={categoryOptions}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}