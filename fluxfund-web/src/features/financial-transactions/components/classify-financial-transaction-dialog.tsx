import { useMemo, useState } from "react"
import { Check, Plus, Trash2 } from "lucide-react"
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
import { EntityCombobox } from "@/components/form/entity-combobox"

import { useCategories } from "@/features/categories/hooks/use-categories"
import { useFunds } from "@/features/funds/hooks/use-funds"
import { useBeneficiaries } from "@/features/beneficiaries/hooks/use-beneficiaries"

import type { FinancialTransaction } from "../financial-transaction-types"
import { useClassifyFinancialTransaction } from "../hooks/use-classify-financial-transaction"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { TransactionAttachmentsSection } from "@/features/attachments/components/transaction-attachments-section"

type AllocationFormItem = {
    fundId: string
    beneficiaryId: string
    amount: string
}

type ClassifyFinancialTransactionDialogProps = {
    transaction: FinancialTransaction
}

export function ClassifyFinancialTransactionDialog({
    transaction,
}: ClassifyFinancialTransactionDialogProps) {
    const [open, setOpen] = useState(false)

    const [type, setType] = useState(transaction.type)
    const [categoryId, setCategoryId] = useState(transaction.category?.id ?? "")
    const [description, setDescription] = useState(transaction.description ?? "")
    const [settlementDate, setSettlementDate] = useState(
        transaction.settlementDate ?? "",
    )
    const [settledAmount, setSettledAmount] = useState(
        String(Math.abs(transaction.settledAmount ?? transaction.expectedAmount ?? 0)),
    )

    const [allocations, setAllocations] = useState<AllocationFormItem[]>([
        {
            fundId: "",
            beneficiaryId: "",
            amount: String(Math.abs(transaction.settledAmount ?? transaction.expectedAmount ?? 0)),
        },
    ])

    const classifyTransaction = useClassifyFinancialTransaction()

    const { data: categoriesData } = useCategories({
        page: 0,
        size: 100,
    })

    const { data: fundsData } = useFunds({
        page: 0,
        size: 100,
    })

    const { data: beneficiariesData } = useBeneficiaries({
        page: 0,
        size: 100,
    })

    const funds = fundsData?.content ?? []
    const beneficiaries = beneficiariesData?.content ?? []

    const filteredCategories = useMemo(() => {
        const categories = categoriesData?.content ?? []
        return categories.filter((category) => category.type === type)
    }, [categoriesData, type])

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

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()

        if (!type) {
            toast.error("Selecione o tipo da transação.")
            return
        }

        if (type === "TRANSFER") {
            toast.error("Transações OFX de transferência ainda devem ser ajustadas manualmente.")
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
            .filter((allocation) => allocation.fundId && Number(allocation.amount || 0) > 0)
            .map((allocation) => ({
                fundId: allocation.fundId,
                beneficiaryId: allocation.beneficiaryId || null,
                amount:
                    type === "EXPENSE"
                        ? -Math.abs(Number(allocation.amount))
                        : Math.abs(Number(allocation.amount)),
            }))

        const hasIncompleteAllocation = allocations.some((allocation) => {
            const amount = Number(allocation.amount || 0)
            return amount > 0 && !allocation.fundId
        })

        if (hasIncompleteAllocation) {
            toast.error("Selecione um fundo para todas as alocações com valor.")
            return
        }

        const allocatedAbsTotal = validAllocations.reduce((total, allocation) => {
            return total + Math.abs(allocation.amount)
        }, 0)

        if (allocatedAbsTotal > amountNumber) {
            toast.error("O valor alocado não pode ultrapassar o valor da transação.")
            return
        }

        if (allocatedAbsTotal < amountNumber) {
            const confirmed = window.confirm(
                "O valor não foi totalmente alocado. Deseja salvar mesmo assim?",
            )

            if (!confirmed) {
                return
            }
        }

        classifyTransaction.mutate(
            {
                transactionId: transaction.id,
                data: {
                    type,
                    categoryId,
                    dueDate: settlementDate,
                    settlementDate,
                    expectedAmount: amountNumber,
                    settledAmount: amountNumber,
                    description,
                    documentNumber: transaction.documentNumber ?? undefined,
                    allocations: validAllocations,
                },
            },
            {
                onSuccess: () => {
                    toast.success("Transação classificada com sucesso.")
                    setOpen(false)
                },
                onError: () => {
                    toast.error("Não foi possível classificar a transação.")
                },
            },
        )
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DropdownMenuItem
                onSelect={(event) => {
                    event.preventDefault()
                    setOpen(true)
                }}
            >
                <Check className="mr-2 size-4" />
                Classificar
            </DropdownMenuItem>

            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Classificar transação OFX</DialogTitle>
                    <DialogDescription>
                        Revise os dados importados e distribua o valor entre fundos e favorecidos.
                    </DialogDescription>
                </DialogHeader>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-lg border bg-muted/30 p-4">
                        <p className="text-sm font-medium">Descrição original do banco</p>
                        <p className="mt-1 text-sm text-muted-foreground">
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
                            <EntityCombobox
                                value={categoryId}
                                placeholder="Selecione a categoria"
                                searchPlaceholder="Buscar categoria..."
                                emptyMessage="Nenhuma categoria encontrada."
                                options={filteredCategories.map((category) => ({
                                    value: category.id,
                                    label: category.name,
                                }))}
                                onChange={setCategoryId}
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
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={settledAmount}
                                onChange={(event) => setSettledAmount(event.target.value)}
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label>Descrição interna</Label>
                            <Input
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
                                    Distribua o valor entre fundos e favorecidos.
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

                        <div className="space-y-4">
                            {allocations.map((allocation, index) => (
                                <div
                                    key={index}
                                    className="grid gap-4 rounded-lg border bg-muted/20 p-4 md:grid-cols-[1fr_1fr_140px_auto]"
                                >
                                    <div className="space-y-2">
                                        <Label>Fundo</Label>
                                        <EntityCombobox
                                            value={allocation.fundId}
                                            placeholder="Selecione o fundo"
                                            searchPlaceholder="Buscar fundo..."
                                            emptyMessage="Nenhum fundo encontrado."
                                            options={funds.map((fund) => ({
                                                value: fund.id,
                                                label: fund.name,
                                            }))}
                                            onChange={(value) =>
                                                handleChangeAllocation(index, "fundId", value)
                                            }
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Favorecido</Label>
                                        <EntityCombobox
                                            value={allocation.beneficiaryId}
                                            placeholder="Sem favorecido"
                                            searchPlaceholder="Buscar favorecido..."
                                            emptyMessage="Nenhum favorecido encontrado."
                                            options={beneficiaries.map((beneficiary) => ({
                                                value: beneficiary.id,
                                                label: beneficiary.name,
                                            }))}
                                            onChange={(value) =>
                                                handleChangeAllocation(index, "beneficiaryId", value)
                                            }
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Valor</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={allocation.amount}
                                            onChange={(event) =>
                                                handleChangeAllocation(index, "amount", event.target.value)
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
                            ))}
                        </div>

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

                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Cancelar
                        </Button>

                        <Button type="submit" disabled={classifyTransaction.isPending}>
                            {classifyTransaction.isPending ? "Salvando..." : "Salvar classificação"}
                        </Button>
                    </div>
                </form>

                <TransactionAttachmentsSection
                    transactionId={transaction.id}
                    enabled={open}
                    mode="manage"
                />
            </DialogContent>
        </Dialog>
    )
}