import { WalletCards, Pencil, Trash2, Wand2 } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import type {
  FinancialTransaction,
  TransactionAllocation,
} from "@/features/financial-transactions/financial-transaction-types"
import type { TransactionAllocationFormData } from "@/features/financial-transactions/transaction-allocation-schema"
import { TransactionAllocationForm } from "@/features/financial-transactions/transaction-allocation-form"
import { useAddTransactionAllocation } from "@/features/financial-transactions/hooks/use-add-transaction-allocation"
import { useUpdateTransactionAllocation } from "@/features/financial-transactions/hooks/use-update-transaction-allocation"
import { useDeleteTransactionAllocation } from "@/features/financial-transactions/hooks/use-delete-transaction-allocation"
import { formatCurrency, formatReferenceMonth, toReferenceMonthDate } from "@/utils/formatters"
import { useOrganizationSettings } from "@/features/organization-settings/hooks/use-organization-settings"

type ManageTransactionAllocationsDialogProps = {
  transaction: FinancialTransaction
}

export function ManageTransactionAllocationsDialog({
  transaction,
}: ManageTransactionAllocationsDialogProps) {
  const [open, setOpen] = useState(false)
  const [editingAllocation, setEditingAllocation] =
    useState<TransactionAllocation | null>(null)

  const { data: organizationSettings } = useOrganizationSettings()
  const defaultFund = organizationSettings?.defaultFund ?? null

  const addAllocationMutation = useAddTransactionAllocation()
  const updateAllocationMutation = useUpdateTransactionAllocation()
  const deleteAllocationMutation = useDeleteTransactionAllocation()

  const totalAllocated = useMemo(() => {
    return transaction.allocations.reduce(
      (total, allocation) => total + Math.abs(allocation.amount),
      0,
    )
  }, [transaction.allocations])

  const settledAmount = Math.abs(transaction.settledAmount ?? 0)
  const remainingAmount = Math.max(settledAmount - totalAllocated, 0)

  function handleSubmitAllocation(data: TransactionAllocationFormData) {
    if (editingAllocation) {
      updateAllocationMutation.mutate(
        {
          transactionId: transaction.id,
          allocationId: editingAllocation.id,
          data: {
            fundId: data.fundId,
            beneficiaryId: data.beneficiaryId || null,
            referenceMonth: toReferenceMonthDate(data.referenceMonth),
            amount: data.amount,
          },
        },
        {
          onSuccess: () => {
            toast.success("Alocação atualizada com sucesso.")
            setEditingAllocation(null)
          },
          onError: () => {
            toast.error("Não foi possível atualizar a alocação.")
          },
        },
      )

      return
    }

    addAllocationMutation.mutate(
      {
        transactionId: transaction.id,
        data: {
          fundId: data.fundId,
          beneficiaryId: data.beneficiaryId || null,
          referenceMonth: toReferenceMonthDate(data.referenceMonth),
          amount: data.amount,
        },
      },
      {
        onSuccess: () => {
          toast.success("Alocação adicionada com sucesso.")
        },
        onError: () => {
          toast.error("Não foi possível adicionar a alocação.")
        },
      },
    )
  }

  function handleAllocateRemainingToDefaultFund() {
    if (!defaultFund) {
      toast.error("Configure um fundo padrão antes de usar esta ação.")
      return
    }

    if (remainingAmount <= 0) {
      toast.error("Não há valor restante para alocar.")
      return
    }

    addAllocationMutation.mutate(
      {
        transactionId: transaction.id,
        data: {
          fundId: defaultFund.id,
          beneficiaryId: null,
          amount: Math.abs(remainingAmount),
          referenceMonth: toReferenceMonthDate(transaction.settlementDate ?? null),
        },
      },
      {
        onSuccess: () => {
          toast.success("Restante alocado no fundo padrão.")
        },
        onError: () => {
          toast.error("Não foi possível alocar no fundo padrão.")
        },
      },
    )
  }

  function handleDeleteAllocation(allocation: TransactionAllocation) {
    const confirmed = window.confirm(
      "Tem certeza que deseja remover esta alocação?",
    )

    if (!confirmed) {
      return
    }

    deleteAllocationMutation.mutate(
      {
        transactionId: transaction.id,
        allocationId: allocation.id,
      },
      {
        onSuccess: () => {
          toast.success("Alocação removida com sucesso.")
        },
        onError: () => {
          toast.error("Não foi possível remover a alocação.")
        },
      },
    )
  }

  const isSubmitting =
    addAllocationMutation.isPending || updateAllocationMutation.isPending

  const canAllocateRemainingToDefaultFund =
    Boolean(defaultFund) &&
    transaction.status === "SETTLED" &&
    transaction.category !== null &&
    transaction.type !== "TRANSFER" &&
    remainingAmount > 0

  return (
    <>
      <DropdownMenuItem
        onSelect={(event) => {
          event.preventDefault()
          setOpen(true)
        }}
      >
        <WalletCards className="mr-2 size-4" />
        Alocações
      </DropdownMenuItem>

      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen)

          if (!isOpen) {
            setEditingAllocation(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Alocações da transação</DialogTitle>
            <DialogDescription>
              Distribua o valor baixado entre fundos e favorecidos. Essa
              alocação não altera o saldo da conta real.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Transação</p>
              <p className="truncate text-sm font-medium">
                {transaction.description}
              </p>
            </div>

            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Valor baixado</p>
              <p className="text-sm font-medium">
                {formatCurrency(settledAmount)}
              </p>
            </div>

            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Total alocado</p>
              <p className="text-sm font-medium">
                {formatCurrency(totalAllocated)}
              </p>
            </div>

            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Restante</p>
              <p className="text-sm font-medium">
                {formatCurrency(remainingAmount)}
              </p>
            </div>
          </div>

          {canAllocateRemainingToDefaultFund && (
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-sm font-medium">
                    Alocação rápida no fundo padrão
                  </h3>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Envie o valor restante para {defaultFund?.name}. Essa ação usa a
                    configuração financeira da organização.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAllocateRemainingToDefaultFund}
                  disabled={addAllocationMutation.isPending}
                >
                  <Wand2 className="mr-2 size-4" />
                  Alocar restante no fundo padrão
                </Button>
              </div>
            </div>
          )}

          <div className="rounded-lg border p-4">
            <h3 className="mb-4 text-sm font-medium">
              {editingAllocation ? "Editar alocação" : "Adicionar alocação"}
            </h3>

            <TransactionAllocationForm
              key={editingAllocation?.id ?? "new-allocation"}
              defaultValues={
                editingAllocation
                  ? {
                    fundId: editingAllocation.fund.id,
                    beneficiaryId: editingAllocation.beneficiary?.id ?? "",
                    referenceMonth: editingAllocation.referenceMonth?.slice(0, 7) ?? "",
                    amount: Math.abs(editingAllocation.amount),
                  }
                  : {
                    amount: remainingAmount,
                  }
              }
              submitLabel={
                editingAllocation ? "Salvar alocação" : "Adicionar alocação"
              }
              onSubmit={handleSubmitAllocation}
              isSubmitting={isSubmitting}
            />

            {editingAllocation && (
              <div className="mt-3 flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setEditingAllocation(null)}
                >
                  Cancelar edição
                </Button>
              </div>
            )}
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fundo</TableHead>
                  <TableHead>Favorecido</TableHead>
                  <TableHead>Competência</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-[100px] text-right">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {transaction.allocations.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-sm text-muted-foreground"
                    >
                      Nenhuma alocação cadastrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  transaction.allocations.map((allocation) => (
                    <TableRow key={allocation.id}>
                      <TableCell>{allocation.fund.name}</TableCell>

                      <TableCell>
                        {allocation.beneficiary?.name ?? "-"}
                      </TableCell>

                      <TableCell>
                        {formatReferenceMonth(allocation.referenceMonth)}
                      </TableCell>

                      <TableCell className="text-right font-medium">
                        {formatCurrency(Math.abs(allocation.amount))}
                      </TableCell>

                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingAllocation(allocation)}
                          >
                            <Pencil className="size-4" />
                            <span className="sr-only">Editar</span>
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteAllocation(allocation)}
                            disabled={deleteAllocationMutation.isPending}
                          >
                            <Trash2 className="size-4 text-destructive" />
                            <span className="sr-only">Remover</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}