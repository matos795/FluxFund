import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, Check, Paperclip, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import type { FinancialTransaction } from "../financial-transaction-types"
import { useClassifyFinancialTransaction } from "../hooks/use-classify-financial-transaction"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import type { AttachmentType } from "@/features/attachments/attachment-types"
import { useUploadAttachment } from "@/features/attachments/hooks/use-upload-attachment"
import { attachmentTypeLabels } from "@/features/attachments/attachment-labels"
import { CurrencyInput } from "@/components/form/currency-input"
import { CategoryComboboxWithCreate } from "@/features/categories/components/category-combobox-with-create"
import { FundComboboxWithCreate } from "@/features/funds/components/fund-combobox-with-create"
import { BeneficiaryComboboxWithCreate } from "@/features/beneficiaries/components/beneficiary-combobox-with-create"
import { useFundOptions } from "@/features/funds/hooks/use-fund-options"
import { useOrganizationSettings } from "@/features/organization-settings/hooks/use-organization-settings"
import { getDefaultFundReallocationSuggestion } from "@/utils/fund-reallocation"
import { formatCurrency } from "@/utils/formatters"
import { getApiErrorMessage } from "@/utils/api-error"
import { SupportAgreementSuggestionCard } from "@/features/support-agreements/components/support-agreement-suggestion-card"

type AllocationFormItem = {
    fundId: string
    beneficiaryId: string
    referenceMonth: string
    amount: string
}

type PendingAttachmentItem = {
    id: string
    type: AttachmentType
    file: File | null
}

type ClassifyFinancialTransactionDialogProps = {
    transaction: FinancialTransaction
    open?: boolean
    onOpenChange?: (open: boolean) => void
    trigger?: React.ReactNode | null
}

export function ClassifyFinancialTransactionDialog({
    transaction,
    open,
    onOpenChange,
    trigger,
}: ClassifyFinancialTransactionDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false)

    const dialogOpen = open ?? internalOpen
    const setDialogOpen = onOpenChange ?? setInternalOpen

    const [type, setType] = useState(transaction.type)
    const [categoryId, setCategoryId] = useState(transaction.category?.id ?? "")
    const [description, setDescription] = useState(transaction.description ?? "")
    const [settlementDate, setSettlementDate] = useState(
        transaction.settlementDate ?? "",
    )
    const [settledAmount, setSettledAmount] = useState(
        String(Math.abs(transaction.settledAmount ?? transaction.expectedAmount ?? 0)),
    )

    const [allocations, setAllocations] = useState<AllocationFormItem[]>([])

    const [pendingAttachments, setPendingAttachments] = useState<PendingAttachmentItem[]>([])

    const classifyTransaction = useClassifyFinancialTransaction()

    const uploadAttachmentMutation = useUploadAttachment(transaction.id)

    const { data: funds = [] } = useFundOptions()
    const { data: settings } = useOrganizationSettings()

    const totalAllocated = useMemo(() => {
        return allocations.reduce((total, allocation) => {
            return total + Number(allocation.amount || 0)
        }, 0)
    }, [allocations])

    const amountNumber = Number(settledAmount || 0)
    const remainingAmount = amountNumber - totalAllocated

    function handleAddAllocation() {
        setAllocations((current) => [
            ...current,
            {
                fundId: "",
                beneficiaryId: "",
                referenceMonth: "",
                amount: remainingAmount > 0 ? String(remainingAmount) : "",
            },
        ])
    }

    function handleRemoveAllocation(index: number) {
        setAllocations((current) => current.filter((_, itemIndex) => itemIndex !== index))
    }

    function handleChangeAllocation(
        index: number,
        field: keyof AllocationFormItem,
        value: string,
    ) {
        setAllocations((current) =>
            current.map((allocation, itemIndex) =>
                itemIndex === index
                    ? {
                        ...allocation,
                        [field]: value,
                    }
                    : allocation,
            ),
        )
    }

    function handleApplyReallocationSuggestion(index: number) {
        const allocation = allocations[index]

        const suggestion = getDefaultFundReallocationSuggestion({
            fundId: allocation.fundId,
            amount: Number(allocation.amount || 0),
            transactionType: type,
            funds,
            settings,
        })

        if (!suggestion) {
            return
        }

        setAllocations((current) => {
            const updated = [...current]

            updated[index] = {
                ...updated[index],
                amount: String(suggestion.selectedFundAmount),
            }

            updated.splice(index + 1, 0, {
                fundId: suggestion.defaultFund.id,
                beneficiaryId: allocation.beneficiaryId,
                referenceMonth: allocation.referenceMonth,
                amount: String(suggestion.defaultFundAmount),
            })

            return updated
        })

        toast.info("Sugestão aplicada. Revise as alocações antes de salvar.")
    }

    function handleAddPendingAttachment() {
        setPendingAttachments((current) => [
            ...current,
            {
                id: crypto.randomUUID(),
                type: "PROOF_OF_PAYMENT",
                file: null,
            },
        ])
    }

    function handleRemovePendingAttachment(id: string) {
        setPendingAttachments((current) =>
            current.filter((attachment) => attachment.id !== id),
        )
    }

    function handleChangePendingAttachmentType(
        id: string,
        type: AttachmentType,
    ) {
        setPendingAttachments((current) =>
            current.map((attachment) =>
                attachment.id === id
                    ? {
                        ...attachment,
                        type,
                    }
                    : attachment,
            ),
        )
    }

    function handleChangePendingAttachmentFile(
        id: string,
        file: File | null,
    ) {
        setPendingAttachments((current) =>
            current.map((attachment) =>
                attachment.id === id
                    ? {
                        ...attachment,
                        file,
                    }
                    : attachment,
            ),
        )
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()

        if (!type) {
            toast.error("Selecione o tipo da transação.")
            return
        }

        if (type === "TRANSFER") {
            toast.error(
                "Transações OFX de transferência ainda devem ser ajustadas manualmente.",
            )
            return
        }

        if (!categoryId) {
            toast.error("Selecione uma categoria.")
            return
        }

        if (!settlementDate) {
            toast.error("Informe a data de baixa.")
            return
        }

        if (!amountNumber || amountNumber <= 0) {
            toast.error("Informe um valor válido.")
            return
        }

        const validAllocations = allocations
            .filter(
                (allocation) =>
                    allocation.fundId &&
                    Number(allocation.amount || 0) > 0,
            )
            .map((allocation) => ({
                fundId: allocation.fundId,
                beneficiaryId: allocation.beneficiaryId || null,
                referenceMonth: allocation.referenceMonth
                    ? `${allocation.referenceMonth}-01`
                    : null,
                amount: Math.abs(Number(allocation.amount)),
            }))

        const hasIncompleteAllocation = allocations.some((allocation) => {
            const amount = Number(allocation.amount || 0)

            return amount > 0 && !allocation.fundId
        })

        if (hasIncompleteAllocation) {
            toast.error("Selecione um fundo para todas as alocações com valor.")
            return
        }

        const allocatedAbsTotal = validAllocations.reduce(
            (total, allocation) => total + Math.abs(allocation.amount),
            0,
        )

        if (allocatedAbsTotal > amountNumber) {
            toast.error(
                "O valor alocado não pode ultrapassar o valor da transação.",
            )
            return
        }

        if (allocatedAbsTotal > 0 && allocatedAbsTotal < amountNumber) {
            const confirmed = window.confirm(
                "O valor foi parcialmente alocado. O restante continuará pendente e poderá ser alocado depois pelo botão de alocar restante. Deseja salvar mesmo assim?",
            )

            if (!confirmed) {
                return
            }
        }

        const hasIncompleteAttachment = pendingAttachments.some(
            (attachment) => !attachment.file,
        )

        if (hasIncompleteAttachment) {
            toast.error(
                "Selecione um arquivo em todos os anexos ou remova a linha vazia.",
            )
            return
        }

        const attachmentsToUpload = pendingAttachments.filter(
            (
                attachment,
            ): attachment is PendingAttachmentItem & { file: File } =>
                attachment.file !== null,
        )

        try {
            await classifyTransaction.mutateAsync({
                transactionId: transaction.id,
                data: {
                    type,
                    categoryId,
                    dueDate: settlementDate,
                    settlementDate,
                    expectedAmount: amountNumber,
                    settledAmount: amountNumber,
                    description: description || undefined,
                    documentNumber: transaction.documentNumber ?? undefined,
                    allocations: validAllocations,
                },
            })

            if (attachmentsToUpload.length === 0) {
                toast.success("Transação classificada com sucesso.")
                setPendingAttachments([])
                setDialogOpen(false)
                return
            }

            const failedFiles: string[] = []

            for (const attachment of attachmentsToUpload) {
                try {
                    await uploadAttachmentMutation.mutateAsync({
                        transactionId: transaction.id,
                        type: attachment.type,
                        file: attachment.file,
                    })
                } catch {
                    failedFiles.push(attachment.file.name)
                }
            }

            if (failedFiles.length === 0) {
                toast.success(
                    attachmentsToUpload.length === 1
                        ? "Transação classificada e anexo enviado com sucesso."
                        : "Transação classificada e anexos enviados com sucesso.",
                )
            } else if (failedFiles.length === attachmentsToUpload.length) {
                toast.warning(
                    "A transação foi classificada, mas nenhum anexo foi enviado. Envie novamente pela ação Anexos.",
                )
            } else {
                toast.warning(
                    `A transação foi classificada, mas alguns anexos falharam: ${failedFiles.join(", ")}.`,
                )
            }

            setPendingAttachments([])
            setDialogOpen(false)
        } catch (error) {
            toast.error(
                getApiErrorMessage(
                    error,
                    "Não foi possível classificar a transação.",
                ),
            )
        }
    }

    useEffect(() => {
        if (!dialogOpen) {
            return
        }

        const resetForm = () => {
            setType(transaction.type)
            setCategoryId(transaction.category?.id ?? "")
            setDescription(transaction.description ?? "")
            setSettlementDate(transaction.settlementDate ?? "")
            setSettledAmount(
                String(
                    Math.abs(
                        transaction.settledAmount ??
                        transaction.expectedAmount ??
                        0,
                    ),
                ),
            )
            setAllocations([])
            setPendingAttachments([])
        }

        const timeoutId = window.setTimeout(resetForm, 0)
        return () => window.clearTimeout(timeoutId)
    }, [dialogOpen, transaction.id, transaction.type, transaction.category?.id, transaction.description, transaction.settlementDate, transaction.settledAmount, transaction.expectedAmount])

    return (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            {trigger === undefined ? (
                <DropdownMenuItem
                    onSelect={(event) => {
                        event.preventDefault()
                        setDialogOpen(true)
                    }}
                >
                    <Check className="mr-2 size-4" />
                    Classificar
                </DropdownMenuItem>
            ) : (
                trigger
            )}

            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Classificar transação OFX</DialogTitle>
                    <DialogDescription>
                        Revise os dados importados e distribua o valor entre fundos e favorecidos.
                    </DialogDescription>
                </DialogHeader>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-lg border bg-muted/30 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Descrição original do banco
                        </p>

                        <p className="mt-2 break-words text-sm">
                            {transaction.rawDescription || transaction.description || "Sem descrição original"}
                        </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Tipo</Label>
                            <Select
                                value={type}
                                onValueChange={(value) => {
                                    setType(value as FinancialTransaction["type"])
                                    setCategoryId("")
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o tipo" />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="INCOME">Receita</SelectItem>
                                    <SelectItem value="EXPENSE">Despesa</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Categoria</Label>
                            <CategoryComboboxWithCreate
                                value={categoryId}
                                type={type === "TRANSFER" ? undefined : type}
                                placeholder="Selecione a categoria"
                                searchPlaceholder="Buscar categoria..."
                                emptyMessage="Nenhuma categoria encontrada."
                                allowClear={false}
                                disabled={type === "TRANSFER"}
                                onChange={(value) => {
                                    setCategoryId(value)

                                    if (!value) {
                                        setPendingAttachments([])
                                    }
                                }}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Data de baixa</Label>
                            <Input
                                type="date"
                                value={settlementDate}
                                onChange={(event) => setSettlementDate(event.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Valor baixado</Label>
                            <CurrencyInput
                                id="settledAmount"
                                value={amountNumber}
                                onValueChange={(value) => setSettledAmount(String(value ?? 0))}
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label>Descrição interna</Label>
                            <Input
                                value={description}
                                placeholder="Ex: Compra de material, oferta destinada, repasse..."
                                onChange={(event) => setDescription(event.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-3 rounded-xl border p-4">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <h3 className="text-sm font-medium">Alocações</h3>
                                <p className="text-xs text-muted-foreground">
                                    Se nenhuma alocação for informada, o sistema usará o fundo padrão.
                                    Se houver alocação parcial, o restante continuará pendente para alocação.
                                </p>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleAddAllocation}
                            >
                                <Plus className="mr-2 size-4" />
                                Adicionar
                            </Button>
                        </div>

                        {allocations.length === 0 ? (
                            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                                Se nenhuma alocação manual for informada, o sistema usará o fundo padrão da
                                organização. Se você informar uma alocação parcial, o restante continuará
                                pendente e poderá ser alocado depois.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {allocations.map((allocation, index) => {
                                    const suggestion = getDefaultFundReallocationSuggestion({
                                        fundId: allocation.fundId,
                                        amount: Number(allocation.amount || 0),
                                        transactionType: type,
                                        funds,
                                        settings,
                                    })

                                    return (
                                        <div key={index} className="space-y-3">
                                            <div className="grid gap-4 rounded-lg border bg-muted/20 p-4 md:grid-cols-2 lg:grid-cols-[1fr_1fr_160px_140px_auto]">
                                                <div className="space-y-2">
                                                    <Label>Fundo</Label>
                                                    <FundComboboxWithCreate
                                                        value={allocation.fundId}
                                                        allowClear={false}
                                                        onChange={(value) =>
                                                            handleChangeAllocation(index, "fundId", value)
                                                        }
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Favorecido</Label>
                                                    <BeneficiaryComboboxWithCreate
                                                        value={allocation.beneficiaryId}
                                                        allowClear
                                                        clearLabel="Sem favorecido"
                                                        onChange={(value) =>
                                                            handleChangeAllocation(index, "beneficiaryId", value)
                                                        }
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Competência</Label>
                                                    <Input
                                                        type="month"
                                                        value={allocation.referenceMonth ? allocation.referenceMonth : ""}
                                                        onChange={(event) =>
                                                            handleChangeAllocation(
                                                                index,
                                                                "referenceMonth",
                                                                event.target.value,
                                                            )
                                                        }
                                                    />
                                                    <p className="text-xs text-muted-foreground">
                                                        Para repasses de outro mês.
                                                    </p>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Valor</Label>
                                                    <CurrencyInput
                                                        value={Number(allocation.amount || 0)}
                                                        onValueChange={(value) =>
                                                            handleChangeAllocation(index, "amount", String(value ?? 0))
                                                        }
                                                    />
                                                </div>

                                                <div className="flex items-end">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleRemoveAllocation(index)}
                                                    >
                                                        <Trash2 className="size-4 text-destructive" />
                                                    </Button>
                                                </div>
                                            </div>

                                            <SupportAgreementSuggestionCard
                                                beneficiaryId={allocation.beneficiaryId}
                                                transactionType={type}
                                                referenceMonth={allocation.referenceMonth}
                                                remainingAmount={Number(allocation.amount || 0)}
                                                onApply={(suggestion) => {
                                                    handleChangeAllocation(index, "fundId", suggestion.fundId)
                                                    handleChangeAllocation(index, "beneficiaryId", suggestion.beneficiaryId)
                                                    handleChangeAllocation(index, "referenceMonth", suggestion.referenceMonth)
                                                    handleChangeAllocation(index, "amount", String(suggestion.amount))
                                                }}
                                            />

                                            {suggestion && (
                                                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                                                    <div className="flex gap-2">
                                                        <AlertTriangle className="mt-0.5 size-4 shrink-0" />

                                                        <div className="space-y-2">
                                                            <p className="font-medium">
                                                                O fundo selecionado não possui saldo suficiente.
                                                            </p>

                                                            <p>
                                                                Saldo disponível em{" "}
                                                                <strong>{suggestion.selectedFund.label}</strong>:{" "}
                                                                {formatCurrency(
                                                                    Math.max(suggestion.selectedFund.currentBalance, 0),
                                                                )}.
                                                            </p>

                                                            <p>
                                                                Sugestão: alocar{" "}
                                                                <strong>{formatCurrency(suggestion.selectedFundAmount)}</strong>{" "}
                                                                em {suggestion.selectedFund.label} e{" "}
                                                                <strong>{formatCurrency(suggestion.defaultFundAmount)}</strong>{" "}
                                                                em {suggestion.defaultFund.label}.
                                                            </p>

                                                            <p className="text-xs">
                                                                Nada será salvo automaticamente. Clique em aplicar, revise e depois salve a classificação.
                                                            </p>

                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleApplyReallocationSuggestion(index)}
                                                            >
                                                                Aplicar sugestão
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        <div className="flex flex-col gap-1 border-t pt-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                            <span className="text-muted-foreground">
                                Total alocado: R$ {totalAllocated.toFixed(2)}
                            </span>

                            <span
                                className={
                                    remainingAmount < 0
                                        ? "font-medium text-destructive"
                                        : "text-muted-foreground"
                                }
                            >
                                Restante: R$ {remainingAmount.toFixed(2)}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-3 rounded-xl border p-4">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <Paperclip className="size-4 text-muted-foreground" />

                                <div>
                                    <h3 className="text-sm font-medium">Anexos opcionais</h3>
                                    <p className="text-xs text-muted-foreground">
                                        Os arquivos serão enviados somente depois que a classificação for salva.
                                    </p>
                                </div>
                            </div>

                            {categoryId && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleAddPendingAttachment}
                                >
                                    <Plus className="mr-2 size-4" />
                                    Adicionar anexo
                                </Button>
                            )}
                        </div>

                        {!categoryId ? (
                            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                                Selecione uma categoria para adicionar anexos à classificação.
                            </div>
                        ) : pendingAttachments.length === 0 ? (
                            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                                Nenhum anexo selecionado. Você pode salvar a classificação sem anexos
                                ou adicionar comprovantes e documentos agora.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {pendingAttachments.map((attachment) => (
                                    <div
                                        key={attachment.id}
                                        className="grid gap-3 rounded-lg border border-dashed p-3 md:grid-cols-[180px_minmax(0,1fr)_auto] md:items-end"
                                    >
                                        <div className="space-y-2">
                                            <Label>Tipo</Label>

                                            <Select
                                                value={attachment.type}
                                                onValueChange={(value) =>
                                                    handleChangePendingAttachmentType(
                                                        attachment.id,
                                                        value as AttachmentType,
                                                    )
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>

                                                <SelectContent>
                                                    <SelectItem value="PROOF_OF_PAYMENT">
                                                        {attachmentTypeLabels.PROOF_OF_PAYMENT}
                                                    </SelectItem>

                                                    <SelectItem value="RECEIPT">
                                                        {attachmentTypeLabels.RECEIPT}
                                                    </SelectItem>

                                                    <SelectItem value="INVOICE">
                                                        {attachmentTypeLabels.INVOICE}
                                                    </SelectItem>

                                                    <SelectItem value="CONTRACT">
                                                        {attachmentTypeLabels.CONTRACT}
                                                    </SelectItem>

                                                    <SelectItem value="OTHER">
                                                        {attachmentTypeLabels.OTHER}
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Arquivo</Label>

                                            <Input
                                                type="file"
                                                accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                                                onChange={(event) =>
                                                    handleChangePendingAttachmentFile(
                                                        attachment.id,
                                                        event.target.files?.[0] ?? null,
                                                    )
                                                }
                                            />

                                            {attachment.file && (
                                                <p className="truncate text-xs text-amber-700">
                                                    {attachment.file.name} será enviado ao salvar a classificação.
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex items-end">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                    handleRemovePendingAttachment(attachment.id)
                                                }
                                            >
                                                <Trash2 className="size-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 border-t pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setDialogOpen(false)}
                        >
                            Cancelar
                        </Button>

                        <Button
                            type="submit"
                            disabled={
                                classifyTransaction.isPending ||
                                uploadAttachmentMutation.isPending
                            }
                        >
                            {classifyTransaction.isPending
                                ? "Salvando classificação..."
                                : uploadAttachmentMutation.isPending
                                    ? "Enviando anexo..."
                                    : "Salvar classificação"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}