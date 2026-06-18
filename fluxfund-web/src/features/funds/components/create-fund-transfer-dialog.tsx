import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowRightLeft } from "lucide-react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"

import { CurrencyInput } from "@/components/form/currency-input"
import { EntityCombobox } from "@/components/form/entity-combobox"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { getApiErrorMessage } from "@/utils/api-error"
import { useFundOptions } from "../hooks/use-fund-options"
import {
    fundTransferFormSchema,
    type FundTransferFormData,
    type FundTransferFormInput,
} from "../fund-transfer-schema"
import { useCreateFundTransfer } from "../hooks/use-create-fund-transfer"
import { AppDialogBody, AppDialogContent, AppDialogFooter, AppDialogHeader } from "@/components/layout/app-dialog"

type CreateFundTransferDialogProps = {
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function CreateFundTransferDialog({
    open,
    onOpenChange,
}: CreateFundTransferDialogProps) {
    const fundsQuery = useFundOptions()
    const createTransferMutation = useCreateFundTransfer()

    const {
        control,
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<FundTransferFormInput, unknown, FundTransferFormData>({
        resolver: zodResolver(fundTransferFormSchema),
        defaultValues: {
            sourceFundId: "",
            destinationFundId: "",
            transferDate: new Date().toISOString().slice(0, 10),
            amount: 0,
            description: "",
        },
    })

    const selectedSourceFundId = useWatch({
        control,
        name: "sourceFundId",
    })

    const fundOptions =
        fundsQuery.data?.map((fund) => ({
            value: fund.id,
            label: `${fund.label} · saldo ${new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
            }).format(fund.currentBalance)}`,
        })) ?? []

    const destinationFundOptions = fundOptions.filter(
        (option) => option.value !== selectedSourceFundId,
    )

    function handleOpenChange(value: boolean) {
        if (!value) {
            reset()
        }

        onOpenChange?.(value)
    }

    function handleCreateTransfer(data: FundTransferFormData) {
        createTransferMutation.mutate(
            {
                sourceFundId: data.sourceFundId,
                destinationFundId: data.destinationFundId,
                transferDate: data.transferDate,
                amount: data.amount,
                description: data.description?.trim() || null,
            },
            {
                onSuccess: () => {
                    toast.success("Transferência entre fundos criada com sucesso.")
                    handleOpenChange(false)
                },
                onError: (error) => {
                    toast.error(
                        getApiErrorMessage(
                            error,
                            "Não foi possível criar a transferência entre fundos.",
                        ),
                    )
                },
            },
        )
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button type="button" variant="outline">
                    <ArrowRightLeft className="mr-2 size-4" />
                    Transferir entre fundos
                </Button>
            </DialogTrigger>

            <AppDialogContent size="lg">
                <AppDialogHeader
                    icon={<ArrowRightLeft className="size-4 text-muted-foreground" />}
                    title="Transferência entre fundos"
                    description="Movimente saldo interno de um fundo para outro sem alterar o histórico das alocações originais."
                />

                <form
                    className="contents"
                    onSubmit={handleSubmit(handleCreateTransfer)}
                >
                    <AppDialogBody className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <Controller
                                control={control}
                                name="sourceFundId"
                                render={({ field }) => (
                                    <div className="space-y-2">
                                        <Label>Fundo origem</Label>
                                        <EntityCombobox
                                            value={field.value ?? ""}
                                            options={fundOptions}
                                            placeholder="Selecione o fundo origem"
                                            searchPlaceholder="Buscar fundo..."
                                            emptyMessage="Nenhum fundo encontrado."
                                            allowClear={false}
                                            onChange={field.onChange}
                                        />
                                        {errors.sourceFundId && (
                                            <p className="text-sm text-destructive">
                                                {errors.sourceFundId.message}
                                            </p>
                                        )}
                                    </div>
                                )}
                            />

                            <Controller
                                control={control}
                                name="destinationFundId"
                                render={({ field }) => (
                                    <div className="space-y-2">
                                        <Label>Fundo destino</Label>
                                        <EntityCombobox
                                            value={field.value ?? ""}
                                            options={destinationFundOptions}
                                            placeholder="Selecione o fundo destino"
                                            searchPlaceholder="Buscar fundo..."
                                            emptyMessage="Nenhum fundo encontrado."
                                            allowClear={false}
                                            disabled={!selectedSourceFundId}
                                            onChange={field.onChange}
                                        />
                                        {errors.destinationFundId && (
                                            <p className="text-sm text-destructive">
                                                {errors.destinationFundId.message}
                                            </p>
                                        )}
                                    </div>
                                )}
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="transferDate">Data</Label>
                                <Input
                                    id="transferDate"
                                    type="date"
                                    {...register("transferDate")}
                                />
                                {errors.transferDate && (
                                    <p className="text-sm text-destructive">
                                        {errors.transferDate.message}
                                    </p>
                                )}
                            </div>

                            <Controller
                                control={control}
                                name="amount"
                                render={({ field }) => (
                                    <div className="space-y-2">
                                        <Label htmlFor="amount">Valor</Label>
                                        <CurrencyInput
                                            id="amount"
                                            value={field.value as number | null | undefined}
                                            onValueChange={field.onChange}
                                        />
                                        {errors.amount && (
                                            <p className="text-sm text-destructive">
                                                {errors.amount.message}
                                            </p>
                                        )}
                                    </div>
                                )}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Motivo</Label>
                            <Textarea
                                id="description"
                                placeholder="Ex: Reforço temporário do fundo Base usando saldo do fundo Pães"
                                {...register("description")}
                            />
                        </div>

                        <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
                            Essa ação não movimenta banco, não gera receita e não gera despesa.
                            Ela apenas transfere saldo interno entre fundos.
                        </div>

                    </AppDialogBody>

                    <AppDialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={createTransferMutation.isPending}
                            onClick={() => handleOpenChange(false)}
                        >
                            Cancelar
                        </Button>

                        <Button
                            type="submit"
                            disabled={createTransferMutation.isPending}
                        >
                            {createTransferMutation.isPending
                                ? "Transferindo..."
                                : "Criar transferência"}
                        </Button>
                    </AppDialogFooter>
                </form>
            </AppDialogContent>
        </Dialog>
    )
}