import { useForm, useWatch } from "react-hook-form"
import { categoryFormSchema, type CategoryFormData, type CategoryFormInput } from "../category-schema"
import { zodResolver } from "@hookform/resolvers/zod"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { categoryTypeLabels } from "../category-labels"
import { Button } from "@/components/ui/button"
import type { Category } from "../category-types"


type CategoryFormProps = {
    onSubmit: (data: CategoryFormData) => void
    isSubmitting?: boolean
    defaultValues?: Partial<CategoryFormInput>
    submitLabel?: string
    categories?: Category[]
    currentCategoryId?: string
}

export function CategoryForm({
    onSubmit,
    isSubmitting = false,
    defaultValues,
    submitLabel = "Salvar categoria",
    categories = [],
    currentCategoryId
}: CategoryFormProps) {

    const { register, handleSubmit, setValue, control, formState: { errors }, } = useForm<CategoryFormInput, unknown, CategoryFormData>({

        resolver: zodResolver(categoryFormSchema),

        defaultValues: {
            name: defaultValues?.name ?? "",
            type: defaultValues?.type ?? "EXPENSE",
            parentId: defaultValues?.parentId ?? null,
        },
    })

    const selectedType = useWatch({ control, name: "type" })
    const selectedParentId = useWatch({ control, name: "parentId" })

    const parentCategoryOptions = categories.filter((category) => {
        if (!category.active) return false
        if (category.id === currentCategoryId) return false
        if (category.type !== selectedType) return false

        return true
    })

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Nome da categoria</Label>
                <Input
                    id="name"
                    placeholder="Ex: Alimentação"
                    {...register("name")}
                />
                {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                    value={selectedType}
                    onValueChange={(value) => {
                        setValue("type", value as CategoryFormInput["type"], {
                            shouldValidate: true,
                        })

                        setValue("parentId", null, {
                            shouldValidate: true,
                        })
                    }}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>

                    <SelectContent>
                        {Object.entries(categoryTypeLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {errors.type && (
                    <p className="text-sm text-destructive">{errors.type.message}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label>Categoria pai</Label>

                <Select
                    value={selectedParentId ?? "none"}
                    onValueChange={(value) =>
                        setValue("parentId", value === "none" ? null : value, {
                            shouldValidate: true,
                        })
                    }
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria pai" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">Nenhuma categoria pai</SelectItem>
                        {parentCategoryOptions?.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                                {category.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {errors.parentId && (
                    <p className="text-sm text-destructive">{errors.parentId.message}</p>
                )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Salvando..." : submitLabel}
                </Button>
            </div>
        </form>
    )
}