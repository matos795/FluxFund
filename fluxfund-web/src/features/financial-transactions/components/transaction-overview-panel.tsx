import { useMemo } from "react"

import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import {
  AppDialogSection,
  AppDialogStatCard,
} from "@/components/layout/app-dialog"
import { TransactionAttachmentsSection } from "@/features/attachments/components/transaction-attachments-section"
import type { FinancialTransaction } from "../financial-transaction-types"
import {
  financialTransactionSourceLabels,
  financialTransactionStatusLabels,
  financialTransactionTypeLabels,
  fiscalDocumentPolicyLabels,
} from "../financial-transaction-labels"
import {
  getFinancialTransactionStatusBadgeClass,
  getFinancialTransactionTypeBadgeClass,
} from "../financial-transaction-badge-styles"
import { formatCurrency, formatDate, formatReferenceMonth } from "@/utils/formatters"

type TransactionOverviewPanelProps = {
  transaction: FinancialTransaction
  attachmentsEnabled: boolean
}

export function TransactionOverviewPanel({
  transaction,
  attachmentsEnabled,
}: TransactionOverviewPanelProps) {
  const totalAllocated = useMemo(() => {
    return transaction.allocations.reduce(
      (total, allocation) => total + Math.abs(allocation.amount),
      0,
    )
  }, [transaction.allocations])

  const settledAmount = Math.abs(transaction.settledAmount ?? 0)
  const remainingAmount = Math.max(settledAmount - totalAllocated, 0)

  const categoryLabel = transaction.category
    ? transaction.category.parentName
      ? `${transaction.category.parentName} > ${transaction.category.name}`
      : transaction.category.name
    : "-"

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-4">
        <AppDialogStatCard
          label="Valor previsto"
          value={formatCurrency(transaction.expectedAmount)}
        />

        <AppDialogStatCard
          label="Valor baixado"
          value={
            transaction.settledAmount !== null
              ? formatCurrency(transaction.settledAmount)
              : "-"
          }
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

      <AppDialogSection title="Classificação">
        <div className="grid gap-4 md:grid-cols-2">
          <DetailItem
            label="Tipo"
            value={
              <Badge
                className={getFinancialTransactionTypeBadgeClass(
                  transaction.type,
                )}
              >
                {financialTransactionTypeLabels[transaction.type]}
              </Badge>
            }
          />

          <DetailItem
            label="Status"
            value={
              <Badge
                className={getFinancialTransactionStatusBadgeClass(
                  transaction.status,
                )}
              >
                {financialTransactionStatusLabels[transaction.status]}
              </Badge>
            }
          />

          <DetailItem
            label="Origem"
            value={financialTransactionSourceLabels[transaction.source]}
          />

          <DetailItem label="Categoria" value={categoryLabel} />
        </div>
      </AppDialogSection>

      <AppDialogSection title="Datas">
        <div className="grid gap-4 md:grid-cols-3">
          {transaction.purchaseDate && (
            <DetailItem
              label="Data da compra"
              value={formatDate(transaction.purchaseDate) ?? "-"}
            />
          )}

          <DetailItem
            label="Vencimento"
            value={formatDate(transaction.dueDate) ?? "-"}
          />

          <DetailItem
            label="Data de baixa"
            value={formatDate(transaction.settlementDate) ?? "-"}
          />
        </div>
      </AppDialogSection>

      <AppDialogSection title="Documento e descrição">
        <div className="grid gap-4">
          <DetailItem
            label="Número do documento"
            value={transaction.documentNumber ?? "-"}
          />

          {transaction.type === "EXPENSE" && (
            <>
              <DetailItem
                label="Regra do documento fiscal"
                value={
                  fiscalDocumentPolicyLabels[
                  transaction.fiscalDocumentPolicy ?? "CATEGORY"
                  ]
                }
              />

              <DetailItem
                label="Motivo da regra fiscal"
                value={transaction.fiscalDocumentNote ?? "-"}
              />
            </>
          )}

          <DetailItem
            label="Descrição interna"
            value={transaction.description?.trim() || "-"}
          />

          <DetailItem
            label="Descrição original do banco"
            value={transaction.rawDescription?.trim() || "-"}
          />
        </div>
      </AppDialogSection>

      <AppDialogSection title="Alocações">
        {transaction.allocations.length === 0 ? (
          <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
            Nenhuma alocação cadastrada.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableBody>
                {transaction.allocations.map((allocation) => (
                  <TableRow key={allocation.id}>
                    <TableCell>{allocation.fund.name}</TableCell>
                    <TableCell>{allocation.beneficiary?.name ?? "-"}</TableCell>
                    <TableCell>
                      {formatReferenceMonth(allocation.referenceMonth)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(Math.abs(allocation.amount))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </AppDialogSection>

      <TransactionAttachmentsSection
        transactionId={transaction.id}
        enabled={attachmentsEnabled}
        mode="readonly"
      />
    </div>
  )
}

type DetailItemProps = {
  label: string
  value: React.ReactNode
}

function DetailItem({ label, value }: DetailItemProps) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="text-sm font-medium">{value}</div>
    </div>
  )
}