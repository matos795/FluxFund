import { FileSignature, Pencil, Trash2, Wand2 } from "lucide-react"
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
  formatCents,
  formatCurrency,
  formatReferenceMonth,
  fromCents,
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
import { useAddTransactionAllocationsBatch } from "../hooks/use-add-transaction-allocations-batch"
import { financialCommitmentRecurrenceLabels, financialCommitmentTypeLabels } from "@/features/financial-commitments/financial-commitment-labels"
import { Badge } from "@/components/ui/badge"
import { ReceiptDraftDialog } from "@/features/receipts/components/receipt-draft-dialog"
import type { ReceiptType } from "@/features/receipts/receipt-types"

type TransactionAllocationsPanelProps = {
  transaction: FinancialTransaction
}

type AllocationPartyContext = {
  sourcePartyId:
  string | null

  recipientPartyId:
  string | null
}

function getSharedAllocationPartyContext(
  allocations:
    TransactionAllocation[],
): AllocationPartyContext | null {
  if (allocations.length === 0) {
    return {
      sourcePartyId: null,
      recipientPartyId: null,
    }
  }

  const firstContext = {
    sourcePartyId:
      allocations[0]
        .sourceParty?.id ??
      null,

    recipientPartyId:
      allocations[0]
        .recipientParty?.id ??
      allocations[0]
        .beneficiary?.id ??
      null,
  }

  const allShareContext =
    allocations.every(
      (allocation) =>
        (
          allocation
            .sourceParty
            ?.id ??
          null
        ) ===
        firstContext.sourcePartyId &&
        (
          allocation
            .recipientParty
            ?.id ??
          allocation
            .beneficiary
            ?.id ??
          null
        ) ===
        firstContext.recipientPartyId,
    )

  return allShareContext
    ? firstContext
    : null
}

export function TransactionAllocationsPanel({
  transaction,
}: TransactionAllocationsPanelProps) {
  const [editingAllocation, setEditingAllocation] =
    useState<TransactionAllocation | null>(null)

  const [
    receiptAllocation,
    setReceiptAllocation,
  ] =
    useState<
      TransactionAllocation | null
    >(null)

  const { data: organizationSettings } = useOrganizationSettings()
  const defaultFund = organizationSettings?.defaultFund ?? null

  const addAllocationMutation = useAddTransactionAllocation()
  const updateAllocationMutation = useUpdateTransactionAllocation()
  const deleteAllocationMutation = useDeleteTransactionAllocation()
  const addAllocationsBatchMutation = useAddTransactionAllocationsBatch()

  const totalAllocated = useMemo(() => {
    const totalInCents = transaction.allocations.reduce(
      (total, allocation) =>
        total + formatCents(Math.abs(allocation.amount)),
      0,
    )

    return fromCents(totalInCents)
  }, [transaction.allocations])

  const settledAmount = fromCents(
    formatCents(Math.abs(transaction.settledAmount ?? 0)),
  )

  const remainingAmount = Math.max(
    fromCents(
      formatCents(settledAmount) - formatCents(totalAllocated),
    ),
    0,
  )

  const remainingPartyContext = useMemo(() => getSharedAllocationPartyContext(
    transaction.allocations,
  ),
    [
      transaction.allocations,
    ],
  )

  const maxFinancialCommitmentAmount =
    editingAllocation
      ? fromCents(
        formatCents(
          remainingAmount,
        ) +
        formatCents(
          Math.abs(
            editingAllocation
              .amount,
          ),
        ),
      )
      : remainingAmount

  const newAllocationFormKey =
    transaction.allocations
      .map(
        (allocation) =>
          [
            allocation.id,
            allocation.fund.id,
            allocation.sourceParty?.id ?? "",
            allocation.recipientParty?.id ??
            allocation.beneficiary?.id ?? "",
            allocation.amount,
            allocation.referenceMonth ?? "",
            allocation.financialCommitment?.id ?? "",
          ].join(":"),
      )
      .join("|")

  const isSubmitting =
    addAllocationMutation.isPending ||
    updateAllocationMutation.isPending ||
    addAllocationsBatchMutation.isPending

  const canAllocateRemainingToDefaultFund =
    Boolean(defaultFund) &&
    transaction.status === "SETTLED" &&
    transaction.category !== null &&
    transaction.type !== "TRANSFER" &&
    remainingAmount > 0 &&
    remainingPartyContext !== null

  function handleSubmitAllocation(data: TransactionAllocationFormData) {
    if (editingAllocation) {
      updateAllocationMutation.mutate(
        {
          transactionId: transaction.id,
          allocationId: editingAllocation.id,
          data: {
            fundId: data.fundId,
            sourcePartyId: data.sourcePartyId || null,
            recipientPartyId: data.recipientPartyId || null,
            referenceMonth: toReferenceMonthDate(data.referenceMonth),
            amount: data.amount,
            financialCommitmentId: data.financialCommitmentId || null,
            clearFinancialCommitment: data.clearFinancialCommitment ?? false,
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
          sourcePartyId: data.sourcePartyId || null,
          recipientPartyId: data.recipientPartyId || null,
          referenceMonth: toReferenceMonthDate(data.referenceMonth),
          amount: data.amount,
          financialCommitmentId: data.financialCommitmentId || null,
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
          sourcePartyId: remainingPartyContext?.sourcePartyId ?? null,
          recipientPartyId: remainingPartyContext?.recipientPartyId ?? null,
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

  function handleApplyReallocationSuggestion(
    data: {
      selectedFundId: string
      selectedFundAmount: number
      defaultFundId: string
      defaultFundAmount: number
      sourcePartyId: string
      recipientPartyId: string
      referenceMonth: string
      financialCommitmentId: string
    },
  ) {
    if (editingAllocation) {
      toast.error("Finalize ou cancele a edição antes de aplicar uma sugestão.")
      return
    }

    const allocations = []

    if (data.selectedFundAmount > 0) {
      allocations.push({
        fundId: data.selectedFundId,
        sourcePartyId: data.sourcePartyId || null,
        recipientPartyId: data.recipientPartyId || null,
        referenceMonth: toReferenceMonthDate(data.referenceMonth),
        amount: data.selectedFundAmount,
        financialCommitmentId: data.financialCommitmentId || null,
      })
    }

    if (data.defaultFundAmount > 0) {
      allocations.push({
        fundId: data.defaultFundId,
        sourcePartyId: data.sourcePartyId || null,
        recipientPartyId: data.recipientPartyId || null,
        referenceMonth: toReferenceMonthDate(data.referenceMonth),
        amount: data.defaultFundAmount,
        financialCommitmentId: data.financialCommitmentId || null,
      })
    }

    if (allocations.length === 0) {
      toast.error("Não há valores para aplicar na sugestão.")
      return
    }

    addAllocationsBatchMutation.mutate(
      {
        transactionId: transaction.id,
        allocations,
      },
      {
        onSuccess: () => {
          toast.success("Sugestão de remanejamento aplicada com sucesso.")
        },
        onError: (error) => {
          toast.error(
            getApiErrorMessage(
              error,
              "Não foi possível aplicar a sugestão de remanejamento.",
            ),
          )
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

  function getDefaultReceiptType(
    allocation:
      TransactionAllocation,
  ): ReceiptType {
    const commitmentType =
      allocation
        .financialCommitment
        ?.commitmentType

    if (
      transaction.type ===
      "INCOME"
    ) {
      switch (
      commitmentType
      ) {
        case "DONATION":
          return "DONATION"

        case "MEMBER_CONTRIBUTION":
          return "MEMBER_CONTRIBUTION"

        case "CUSTOMER_PAYMENT":
          return "CUSTOMER_PAYMENT"

        case "SPONSORSHIP":
          return "SPONSORSHIP"

        default:
          return "OTHER_INCOME"
      }
    }

    switch (
    commitmentType
    ) {
      case "SUPPLIER_PAYMENT":
        return "SUPPLIER_PAYMENT"

      case "SERVICE_PAYMENT":
        return "SERVICE_PAYMENT"

      case "REIMBURSEMENT":
        return "REIMBURSEMENT"

      default:
        return "OTHER_PAYMENT"
    }
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
        description={
          transaction.type === "INCOME"
            ? "Identifique quem enviou o recurso e distribua o valor entre fundos e destinações."
            : "Distribua o pagamento entre fundos e recebedores."
        }
      >
        {!editingAllocation &&
          transaction.allocations.length >
          0 &&
          remainingAmount <= 0 ? (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
            <div className="flex gap-3">
              <Pencil className="mt-0.5 size-4 shrink-0" />

              <div className="space-y-1">
                <p className="font-medium">
                  Esta transação já está totalmente alocada
                </p>

                <p className="text-xs">
                  Para relacionar o valor a um compromisso, clique no lápis da alocação correspondente na tabela abaixo.
                </p>

                <p className="text-xs">
                  Você poderá informar a origem ou o recebedor, confirmar a competência e selecionar o compromisso sem criar uma nova distribuição.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <TransactionAllocationForm
            key={
              editingAllocation
                ? `edit-${editingAllocation.id}`
                : `new-${newAllocationFormKey}`
            }
            onCancel={editingAllocation ? () => setEditingAllocation(null) : undefined}
            transactionType={transaction.type}
            defaultValues={
              editingAllocation
                ? {
                  fundId: editingAllocation.fund.id,
                  sourcePartyId: editingAllocation.sourceParty?.id ?? "",
                  recipientPartyId: editingAllocation.recipientParty?.id ?? editingAllocation.beneficiary?.id ?? "",
                  referenceMonth: editingAllocation.referenceMonth?.slice(0, 7) ?? "",
                  amount: Math.abs(editingAllocation.amount),
                  financialCommitmentId: editingAllocation.financialCommitment?.id ?? "",
                  clearFinancialCommitment: false,
                }
                : {
                  sourcePartyId: remainingPartyContext?.sourcePartyId ?? "",
                  recipientPartyId: remainingPartyContext?.recipientPartyId ?? "",
                  referenceMonth: transaction.settlementDate?.slice(0, 7) ?? "",
                  amount: remainingAmount,
                  financialCommitmentId: "",
                  clearFinancialCommitment: false,
                }
            }
            submitLabel={editingAllocation ? "Salvar alocação" : "Adicionar alocação"}
            onSubmit={handleSubmitAllocation}
            isSubmitting={isSubmitting}
            isApplyingReallocation={addAllocationsBatchMutation.isPending}
            maxFinancialCommitmentAmount={maxFinancialCommitmentAmount}
            excludedAllocationId={editingAllocation?.id}
            currentFinancialCommitment={editingAllocation?.financialCommitment ?? null}
            onApplyReallocationSuggestion={editingAllocation ? undefined : handleApplyReallocationSuggestion}
          />
        )}
      </AppDialogSection>

      <AppDialogSection
        title="Alocações cadastradas"
        description="Veja, edite ou remova as distribuições desta transação."
      >
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Origem da receita</TableHead>
                <TableHead>Fundo</TableHead>
                <TableHead>Destinatário / recebedor</TableHead>
                <TableHead>Competência</TableHead>
                <TableHead>Compromisso</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="w-[100px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {transaction.allocations.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-24 text-center text-sm text-muted-foreground"
                  >
                    Nenhuma alocação cadastrada.
                  </TableCell>
                </TableRow>
              ) : (
                transaction.allocations.map((allocation) => (
                  <TableRow key={allocation.id}>
                    <TableCell>{allocation.sourceParty?.name ?? "-"}</TableCell>
                    <TableCell>{allocation.fund.name}</TableCell>
                    <TableCell>{allocation.recipientParty?.name ?? allocation.beneficiary?.name ?? "-"}</TableCell>
                    <TableCell>
                      {formatReferenceMonth(allocation.referenceMonth)}
                    </TableCell>
                    <TableCell>
                      {allocation
                        .financialCommitment ? (
                        <div className="min-w-44 space-y-1">
                          <Badge variant="outline">
                            Vinculado
                          </Badge>

                          <p className="text-sm font-medium">
                            {
                              financialCommitmentTypeLabels[
                              allocation
                                .financialCommitment
                                .commitmentType
                              ]
                            }
                          </p>

                          <p className="text-xs text-muted-foreground">
                            {
                              financialCommitmentRecurrenceLabels[
                              allocation
                                .financialCommitment
                                .recurrence
                              ]
                            }
                            {" · "}
                            Previsto{" "}
                            {
                              formatCurrency(
                                allocation
                                  .financialCommitment
                                  .amount,
                              )
                            }
                          </p>

                          {allocation
                            .financialCommitment
                            .plannedFund
                            .id !==
                            allocation.fund.id && (
                              <p className="text-xs text-amber-700">
                                Fundo previsto:{" "}
                                {
                                  allocation
                                    .financialCommitment
                                    .plannedFund
                                    .name
                                }
                              </p>
                            )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Sem compromisso
                        </span>
                      )}
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
                          title="Criar recibo"
                          onClick={() =>
                            setReceiptAllocation(
                              allocation,
                            )
                          }
                        >
                          <FileSignature className="size-4" />

                          <span className="sr-only">
                            Criar recibo
                          </span>
                        </Button>

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

          <ReceiptDraftDialog
            open={
              receiptAllocation !==
              null
            }
            onOpenChange={(open) => {
              if (!open) {
                setReceiptAllocation(
                  null,
                )
              }
            }}
            source={
              receiptAllocation
                ? {
                  sourceType:
                    "ALLOCATION",

                  financialTransactionId:
                    transaction.id,

                  transactionAllocationId:
                    receiptAllocation.id,

                  defaultReceiptType:
                    getDefaultReceiptType(
                      receiptAllocation,
                    ),

                  defaultAmount:
                    Math.abs(
                      receiptAllocation.amount,
                    ),

                  defaultPaymentDate:
                    transaction.settlementDate ??
                    undefined,

                  defaultPurpose:
                    transaction.description
                      ?.trim() ||
                    transaction.rawDescription
                      ?.trim() ||
                    "",

                  description:
                    `${receiptAllocation.fund.name} · ${receiptAllocation.sourceParty
                      ?.name ??
                    receiptAllocation.recipientParty
                      ?.name ??
                    receiptAllocation.beneficiary
                      ?.name ??
                    "Sem contato"
                    }`,
                }
                : null
            }
          />
        </div>
      </AppDialogSection>
    </div>
  )
}
