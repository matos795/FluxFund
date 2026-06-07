import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { CategoryForm } from "./category-form";
import { useState } from "react";
import type { CategoryFormData } from "../category-schema";
import { useCreateCategory } from "../hooks/use-create-category";
import { toast } from "sonner";
import { useCategoryOptions } from "../hooks/use-category-options";

export function CreateCategoryDialog() {

  const [open, setOpen] = useState(false)

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
        onSuccess: () => {
          toast.success("Categoria criada com sucesso!")
          setOpen(false)
        },
        onError: () => {
          toast.error("Erro ao criar categoria. Tente novamente.")
        }
      },
    )
  }

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus className="mr-2 size-4" />
        Nova categoria
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
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