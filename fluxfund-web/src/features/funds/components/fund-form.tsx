import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { fundFormSchema, type FundFormData, type FundFormInput } from "../fund-schema"
import { CurrencyInput } from "@/components/form/currency-input"

type FundFormProps = {
    onSubmit: (data: FundFormData) => void
    isSubmitting?: boolean
    defaultValues?: Partial<FundFormInput>
    submitLabel?: string
}

export function FundForm({
    onSubmit,
    isSubmitting = false,
    defaultValues,
    submitLabel = "Salvar fundo",
}: FundFormProps) {
    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
    } = useForm<FundFormInput, unknown, FundFormData>({
        resolver: zodResolver(fundFormSchema),
        defaultValues: {
            name: defaultValues?.name ?? "",
            description: defaultValues?.description ?? "",
            initialBalance: defaultValues?.initialBalance ?? 0,
            initialBalanceDate: defaultValues?.initialBalanceDate ?? new Date().toISOString().slice(0, 10),
        },
    })

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Nome do fundo</Label>
                <Input
                    id="name"
                    placeholder="Ex: Projeto Piauí, Livraria, Missões"
                    {...register("name")}
                />
                {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input
                    id="description"
                    placeholder="Ex: Fundo para controlar recursos destinados ao projeto"
                    {...register("description")}
                />
                {errors.description && (
                    <p className="text-sm text-destructive">{errors.description.message}</p>
                )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="initialBalance">Saldo inicial</Label>
                    <Controller
                        name="initialBalance"
                        control={control}
                        render={({ field }) => (
                            <CurrencyInput
                                id="initialBalance"
                                value={field.value as number | null | undefined}
                                onValueChange={field.onChange}
                            />
                        )}
                    />
                    {errors.initialBalance && (
                        <p className="text-sm text-destructive">
                            {errors.initialBalance.message}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="initialBalanceDate">Data do saldo inicial</Label>
                    <Input
                        id="initialBalanceDate"
                        type="date"
                        {...register("initialBalanceDate")}
                    />
                    {errors.initialBalanceDate && (
                        <p className="text-sm text-destructive">
                            {errors.initialBalanceDate.message}
                        </p>
                    )}
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