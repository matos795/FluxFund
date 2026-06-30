import { zodResolver } from "@hookform/resolvers/zod"
import { GitBranch } from "lucide-react"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import {
    AppDialogBody,
    AppDialogContent,
    AppDialogFooter,
    AppDialogHeader,
} from "@/components/layout/app-dialog"
import { CurrencyInput } from "@/components/form/currency-input"
import { Button } from "@/components/ui/button"
import { Dialog } from "@/components/ui/dialog"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { getApiErrorMessage } from "@/utils/api-error"

import { useCreateSupportAgreementVersion } from "../hooks/use-create-support-agreement-version"
import type { SupportAgreement } from "../support-agreement-types"

const versionSchema = z.object({
    amount: z.coerce
        .number()
        .min(0.01, "O valor deve ser maior que zero."),
    startDate: z.string().min(1, "Informe a data de início."),
    description: z.string().max(255, "A descrição pode ter no máximo 255 caracteres."),
})

type VersionFormInput = z.input<typeof versionSchema>
type VersionFormData = z.output<typeof versionSchema>

type CreateSupportAgreementVersionDialogProps = {
    agreement: SupportAgreement
}

export function CreateSupportAgreementVersionDialog({
    agreement,
}: CreateSupportAgreementVersionDialogProps) {
    const [open, setOpen] = useState(false)

    const createVersionMutation = useCreateSupportAgreementVersion()

    const {
        control,
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors },
    } = useForm<VersionFormInput, unknown, VersionFormData>({
        resolver: zodResolver(versionSchema),
        defaultValues: {
            amount: agreement.amount,
            startDate: "",
            description: agreement.description ?? "",
        },
    })

    function resetForm() {
        reset({
            amount: agreement.amount,
            startDate: "",
            description: agreement.description ?? "",
        })
    }

    function handleOpenChange(value: boolean) {
        setOpen(value)

        if (!value) {
            resetForm()
        }
    }

    function handleCreateVersion(data: VersionFormData) {
        if (data.startDate <= agreement.startDate) {
            setError("startDate", {
                message:
                    "A nova vigência deve começar depois do início do compromisso atual.",
            })
            return
        }

        createVersionMutation.mutate(
            {
                id: agreement.id,
                data: {
                    amount: data.amount,
                    startDate: data.startDate,
                    description: data.description.trim() || null,
                },
            },
            {
                onSuccess: () => {
                    toast.success("Nova vigência criada com sucesso.")
                    handleOpenChange(false)
                },
                onError: (error) => {
                    toast.error(
                        getApiErrorMessage(
                            error,
                            "Não foi possível criar a nova vigência do compromisso.",
                        ),
                    )
                },
            },
        )
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DropdownMenuItem
                onSelect={(event) => {
                    event.preventDefault()
                    resetForm()
                    setOpen(true)
                }}
            >
                <GitBranch className="mr-2 size-4" />
                Alterar a partir de...
            </DropdownMenuItem>

            <AppDialogContent size="md">
                <AppDialogHeader
                    icon={<GitBranch className="size-4 text-muted-foreground" />}
                    title="Criar nova vigência"
                    description="O compromisso atual será encerrado automaticamente no dia anterior à nova data."
                />

                <form
                    className="contents"
                    onSubmit={handleSubmit(handleCreateVersion)}
                >
                    <AppDialogBody className="space-y-5">
                        <div className="rounded-lg border bg-muted/40 p-4 text-sm">
                            <p className="font-medium">
                                {agreement.beneficiary.name} · {agreement.fund.name}
                            </p>

                            <p className="mt-1 text-muted-foreground">
                                Compromisso atual:{" "}
                                <strong>{formatCurrency(agreement.amount)}</strong> desde{" "}
                                <strong>{formatDate(agreement.startDate)}</strong>.
                            </p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="version-amount">Novo valor mensal</Label>

                                <Controller
                                    name="amount"
                                    control={control}
                                    render={({ field }) => (
                                        <CurrencyInput
                                            id="version-amount"
                                            value={field.value as number | null | undefined}
                                            onValueChange={field.onChange}
                                        />
                                    )}
                                />

                                {errors.amount && (
                                    <p className="text-sm text-destructive">
                                        {errors.amount.message}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="version-start-date">
                                    Novo valor a partir de
                                </Label>

                                <Input
                                    id="version-start-date"
                                    type="date"
                                    {...register("startDate")}
                                />

                                {errors.startDate && (
                                    <p className="text-sm text-destructive">
                                        {errors.startDate.message}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="version-description">Descrição</Label>

                            <Textarea
                                id="version-description"
                                placeholder="Ex: Ajuste do valor mensal a partir de junho"
                                {...register("description")}
                            />

                            {errors.description && (
                                <p className="text-sm text-destructive">
                                    {errors.description.message}
                                </p>
                            )}
                        </div>
                    </AppDialogBody>

                    <AppDialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={createVersionMutation.isPending}
                            onClick={() => handleOpenChange(false)}
                        >
                            Cancelar
                        </Button>

                        <Button
                            type="submit"
                            disabled={createVersionMutation.isPending}
                        >
                            {createVersionMutation.isPending
                                ? "Criando..."
                                : "Criar nova vigência"}
                        </Button>
                    </AppDialogFooter>
                </form>
            </AppDialogContent>
        </Dialog>
    )
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value)
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
    }).format(new Date(`${value}T00:00:00`))
}