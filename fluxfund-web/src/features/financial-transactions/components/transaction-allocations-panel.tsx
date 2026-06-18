import { Pencil, Trash2, Wand2 } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import {
  AppDialogSection,
  AppDialogStatCard,
} from "@/components/layout/app-dialog"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useOrganizationSettings } from "@/features/organization-settings/hooks/use-organization-settings"
import { getApiErrorMessage } from "@/utils/api-error"
import {
  formatCurrency,
  formatReferenceMonth,
  toReferenceMonthDate,
} from "@/utils/formatters"

import type {
  FinancialTransaction,
  TransactionAllocation,
} from "../financial-transaction-types"
import type { TransactionAllocationFormData } from "../transaction-allocation-schema"
import { useAddTransactionAllocation } from "../hooks/use-add-transaction-allocation"
import { useDeleteTransactionAllocation } from "../hooks/use-delete-transaction-allocation"
import { useUpdateTransactionAllocation } from "../hooks/use-update-transaction-allocation"
import { TransactionAllocationForm } from "./transaction-allocation-form"

type TransactionAllocationsPanelProps = {
  transaction: FinancialTransaction
}

export function TransactionAllocationsPanel({
  transaction,
}: TransactionAllocationsPanelProps) {
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

  const isSubmitting =
    addAllocationMutation.isPending || updateAllocationMutation.isPending

  const canAllocateRemainingToDefaultFund =
    Boolean(defaultFund) &&
    transaction.status === "SETTLED" &&
    transaction.category !== null &&
    transaction.type !== "TRANSFER" &&
    remainingAmount > 0

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
          onError: (error) => {
            toast.error(
              getApiErrorMessage(
                error,
                "Não foi possível atualizar a alocação.",
              ),
            )
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
        onError: (error) => {
          toast.error(
            getApiErrorMessage(
              error,
              "Não foi possível adicionar a alocação.",
            ),
          )
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
          referenceMonth: null,
        },
      },
      {
        onSuccess: () => {
          toast.success("Restante alocado no fundo padrão.")
        },
        onError: (error) => {
          toast.error(
            getApiErrorMessage(
              error,
              "Não foi possível alocar no fundo padrão.",
            ),
          )
        },
      },
    )
  }

  function handleApplyReallocationSuggestion(data: {
    selectedFundId: string
    selectedFundAmount: number
    defaultFundId: string
    defaultFundAmount: number
    beneficiaryId: string
    referenceMonth: string
  }) {
    if (editingAllocation) {
      toast.error("Finalize ou cancele a edição antes de aplicar uma sugestão.")
      return
    }

    const requests = []

    if (data.selectedFundAmount > 0) {
      requests.push(
        addAllocationMutation.mutateAsync({
          transactionId: transaction.id,
          data: {
            fundId: data.selectedFundId,
            beneficiaryId: data.beneficiaryId || null,
            referenceMonth: toReferenceMonthDate(data.referenceMonth),
            amount: data.selectedFundAmount,
          },
        }),
      )
    }

    if (data.defaultFundAmount > 0) {
      requests.push(
        addAllocationMutation.mutateAsync({
          transactionId: transaction.id,
          data: {
            fundId: data.defaultFundId,
            beneficiaryId: data.beneficiaryId || null,
            referenceMonth: toReferenceMonthDate(data.referenceMonth),
            amount: data.defaultFundAmount,
          },
        }),
      )
    }

    if (requests.length === 0) {
      toast.error("Não há valores para aplicar na sugestão.")
      return
    }

    Promise.all(requests)
      .then(() => {
        toast.success("Sugestão de remanejamento aplicada com sucesso.")
      })
      .catch((error) => {
        toast.error(
          getApiErrorMessage(
            error,
            "Não foi possível aplicar a sugestão de remanejamento.",
          ),
        )
      })
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
        onError: (error) => {
          toast.error(
            getApiErrorMessage(
              error,
              "Não foi possível remover a alocação.",
            ),
          )
        },
      },
    )
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-4">
        <AppDialogStatCard
          label="Transação"
          value={transaction.description?.trim() || transaction.rawDescription || "-"}
        />

        <AppDialogStatCard
          label="Valor baixado"
          value={formatCurrency(settledAmount)}
        />

        <AppDialogStatCard
          label="Total alocado"
          value={formatCurrency(totalAllocated)}
        />

        <AppDialogStatCard
          label="Restante"
          value={formatCurrency(remainingAmount)}
        />
      </div>

      {canAllocateRemainingToDefaultFund && (
        <AppDialogSection
          title="Alocação rápida"
          description={`Envie o valor restante para ${defaultFund?.name}.`}
          action={
            <Button
              type="button"
              variant="outline"
              onClick={handleAllocateRemainingToDefaultFund}
              disabled={addAllocationMutation.isPending}
            >
              <Wand2 className="mr-2 size-4" />
              Alocar restante
            </Button>
          }
        />
      )}

      <AppDialogSection
        title={editingAllocation ? "Editar alocação" : "Adicionar alocação"}
        description="Distribua o valor baixado entre fundos e favorecidos."
      >
        <TransactionAllocationForm
          key={editingAllocation?.id ?? "new-allocation"}
          onCancel={editingAllocation ? () => setEditingAllocation(null) : undefined}
          transactionType={transaction.type}
          defaultValues={
            editingAllocation
              ? {
                  fundId: editingAllocation.fund.id,
                  beneficiaryId: editingAllocation.beneficiary?.id ?? "",
                  referenceMonth:
                    editingAllocation.referenceMonth?.slice(0, 7) ?? "",
                  amount: Math.abs(editingAllocation.amount),
                }
              : {
                  amount: remainingAmount,
                }
          }
          submitLabel={editingAllocation ? "Salvar alocação" : "Adicionar alocação"}
          onSubmit={handleSubmitAllocation}
          isSubmitting={isSubmitting}
          onApplyReallocationSuggestion={
            editingAllocation ? undefined : handleApplyReallocationSuggestion
          }
        />
      </AppDialogSection>

      <AppDialogSection
        title="Alocações cadastradas"
        description="Veja, edite ou remova as distribuições desta transação."
      >
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fundo</TableHead>
                <TableHead>Favorecido</TableHead>
                <TableHead>Competência</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="w-[100px] text-right">Ações</TableHead>
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
                    <TableCell>{allocation.beneficiary?.name ?? "-"}</TableCell>
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
      </AppDialogSection>
    </div>
  )
}
