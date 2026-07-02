import { useForm, useWatch } from "react-hook-form"
import { categoryFormSchema, type CategoryFormData, type CategoryFormInput } from "../category-schema"
import { zodResolver } from "@hookform/resolvers/zod"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { categoryTypeLabels } from "../category-labels"
import { Button } from "@/components/ui/button"
import { CategoryCombobox } from "@/components/form/category-combobox"
import type { CategoryOption } from "../category-types"
import { Switch } from "@/components/ui/switch"
import { FileCheck2, ReceiptText } from "lucide-react"
import type { FormEvent } from "react"


type CategoryFormProps = {
    onSubmit: (data: CategoryFormData) => void
    isSubmitting?: boolean
    defaultValues?: Partial<CategoryFormInput>
    submitLabel?: string
    categories?: CategoryOption[]
    currentCategoryId?: string
}

export function CategoryForm({
    onSubmit,
    isSubmitting = false,
    defaultValues,
    submitLabel = "Salvar categoria",
    categories = [],
}: CategoryFormProps) {

    const { register, handleSubmit, setValue, control, formState: { errors }, } = useForm<CategoryFormInput, unknown, CategoryFormData>({

        resolver: zodResolver(categoryFormSchema),

        defaultValues: {
            name: defaultValues?.name ?? "",
            type: defaultValues?.type ?? "EXPENSE",
            parentId: defaultValues?.parentId ?? null,
            requiresFiscalDocument:
                defaultValues?.requiresFiscalDocument ??
                (defaultValues?.type === "INCOME" ? false : true),
            requiresPaymentProof: defaultValues?.requiresPaymentProof ?? false,
        },
    })

    const selectedType = useWatch({ control, name: "type" })
    const selectedParentId = useWatch({ control, name: "parentId" })

    const requiresFiscalDocument = useWatch({
        control,
        name: "requiresFiscalDocument",
    })

    const requiresPaymentProof = useWatch({
        control,
        name: "requiresPaymentProof",
    })

    function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
        event.stopPropagation()

        void handleSubmit(onSubmit)(event)
    }

    return (
        <form onSubmit={handleFormSubmit} className="space-y-4">
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
                        const nextType = value as CategoryFormInput["type"]

                        setValue("type", nextType, {
                            shouldValidate: true,
                        })

                        setValue("parentId", null, {
                            shouldValidate: true,
                        })

                        setValue("requiresFiscalDocument", nextType === "EXPENSE", {
                            shouldValidate: true,
                        })

                        setValue("requiresPaymentProof", false, {
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

                <CategoryCombobox
                    value={selectedParentId ?? ""}
                    options={categories.filter(
                        (category) => category.type === selectedType,
                    )}
                    placeholder="Sem categoria pai"
                    searchPlaceholder="Buscar categoria pai..."
                    emptyMessage="Nenhuma categoria encontrada."
                    allowClear
                    clearLabel="Sem categoria pai"
                    onChange={(value) =>
                        setValue("parentId", value || undefined, {
                            shouldValidate: true,
                        })
                    }
                />

                {errors.parentId && (
                    <p className="text-sm text-destructive">{errors.parentId.message}</p>
                )}
            </div>

            <div className="space-y-3 rounded-xl border p-4">
                <div>
                    <h3 className="text-sm font-medium">Documentação exigida</h3>
                    <p className="text-sm text-muted-foreground">
                        Defina quais documentos esta categoria deve cobrar na conferência.
                    </p>
                </div>

                <div className="flex items-start justify-between gap-4 rounded-lg bg-muted/40 p-3">
                    <div className="flex gap-3">
                        <div className="rounded-lg bg-background p-2">
                            <FileCheck2 className="size-4 text-muted-foreground" />
                        </div>

                        <div className="space-y-1">
                            <p className="text-sm font-medium">
                                Exigir documento fiscal/documental
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Use para nota fiscal, recibo, contrato ou documento equivalente.
                            </p>
                        </div>
                    </div>

                    <Switch
                        checked={requiresFiscalDocument}
                        onCheckedChange={(value) =>
                            setValue("requiresFiscalDocument", value, {
                                shouldValidate: true,
                            })
                        }
                    />
                </div>

                <div className="flex items-start justify-between gap-4 rounded-lg bg-muted/40 p-3">
                    <div className="flex gap-3">
                        <div className="rounded-lg bg-background p-2">
                            <ReceiptText className="size-4 text-muted-foreground" />
                        </div>

                        <div className="space-y-1">
                            <p className="text-sm font-medium">
                                Exigir comprovante de pagamento/repasse
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Use para repasses, pagamentos ou casos em que o comprovante bancário
                                é obrigatório.
                            </p>
                        </div>
                    </div>

                    <Switch
                        checked={requiresPaymentProof}
                        onCheckedChange={(value) =>
                            setValue("requiresPaymentProof", value, {
                                shouldValidate: true,
                            })
                        }
                    />
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Salvando..." : submitLabel}
                </Button>
            </div>
        </form>
    )
}