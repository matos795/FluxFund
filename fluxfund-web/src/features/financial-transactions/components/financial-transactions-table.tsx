import { useState } from "react"
import { AlertCircle, CalendarDays, CheckCircle2, CircleDollarSign, FileCheck2, FileWarning } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency, formatDate } from "@/utils/formatters"
import type { FinancialTransaction } from "../financial-transaction-types"
import {
  financialTransactionSourceLabels,
  financialTransactionStatusLabels,
  financialTransactionTypeLabels,
  transferDirectionLabels,
} from "../financial-transaction-labels"
import {
  getFinancialTransactionStatusBadgeClass,
  getFinancialTransactionTypeBadgeClass,
} from "../financial-transaction-badge-styles"
import { FinancialTransactionActions } from "./financial-transaction-actions"
import { ViewFinancialTransactionDialog } from "./view-financial-transaction-dialog"
import { ClassifyFinancialTransactionDialog } from "./classify-financial-transaction-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { needsFinancialTransactionClassification } from "../financial-transaction-rules"
import { usePermissions } from "@/features/auth/hooks/use-permissions"
import { useOrganizationSettings } from "@/features/organization-settings/hooks/use-organization-settings"
import type { OrganizationSettings } from "@/features/organization-settings/organization-settings-types"
import { getTransactionDocumentationStatus } from "../transaction-documentation"

type FinancialTransactionsTableProps = {
  financialTransactions: FinancialTransaction[]
  totalElements: number
  size: number
  sort: string
  onSizeChange: (size: number) => void
  onSortChange: (sort: string) => void
}

export function FinancialTransactionsTable({
  financialTransactions,
  totalElements,
  size,
  sort,
  onSizeChange,
  onSortChange,
}: FinancialTransactionsTableProps) {

  const { canFinanceWrite } = usePermissions()
  const settingsQuery = useOrganizationSettings()

  const [transactionToView, setTransactionToView] =
    useState<FinancialTransaction | null>(null)

  const [transactionToClassify, setTransactionToClassify] =
    useState<FinancialTransaction | null>(null)

  function handleRowClick(transaction: FinancialTransaction) {
    if (
      canFinanceWrite &&
      needsFinancialTransactionClassification(transaction)
    ) {
      setTransactionToClassify(transaction)
      return
    }

    setTransactionToView(transaction)
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-base">Lançamentos financeiros</CardTitle>
            <p className="text-xs text-muted-foreground">
              {totalElements} transações encontradas
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="w-full sm:w-36">
              <Select
                value={String(size)}
                onValueChange={(value) => onSizeChange(Number(value))}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Itens por página" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="10">10 / página</SelectItem>
                  <SelectItem value="20">20 / página</SelectItem>
                  <SelectItem value="50">50 / página</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full sm:w-44">
              <Select value={sort} onValueChange={onSortChange}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="settlementDate,desc">Mais recentes</SelectItem>
                  <SelectItem value="settlementDate,asc">Mais antigas</SelectItem>
                  <SelectItem value="settledAmount,desc">Maior valor</SelectItem>
                  <SelectItem value="settledAmount,asc">Menor valor</SelectItem>
                  <SelectItem value="createdAt,desc">Criação recente</SelectItem>
                  <SelectItem value="createdAt,asc">Criação antiga</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {financialTransactions.length === 0 ? (
            <div className="m-4 flex h-48 items-center justify-center rounded-lg border border-dashed">
              <p className="text-sm text-muted-foreground">
                Nenhuma transação cadastrada ainda.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">Situação</TableHead>
                    <TableHead className="w-[110px]">Data</TableHead>
                    <TableHead className="w-[110px]">Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="w-[170px]">Conta</TableHead>
                    <TableHead className="w-[170px]">Categoria</TableHead>
                    <TableHead className="w-[130px] text-right">Valor</TableHead>
                    <TableHead className="w-[130px]">Alocação</TableHead>
                    <TableHead className="w-[90px]">Docs</TableHead>
                    <TableHead className="w-[50px]" />
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {financialTransactions.map((transaction) => {
                    const allocationStatus = getAllocationStatus(transaction)
                    const displayDescription =
                      transaction.description?.trim() ||
                      transaction.rawDescription?.trim() ||
                      "-"

                    return (
                      <TableRow
                        key={transaction.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleRowClick(transaction)}
                      >
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {needsFinancialTransactionClassification(transaction) ? (
                              <Badge className="w-fit bg-orange-100 text-orange-700 hover:bg-orange-100">
                                <AlertCircle className="mr-1 size-3" />
                                Classificar
                              </Badge>
                            ) : (
                              <Badge
                                className={getFinancialTransactionStatusBadgeClass(
                                  transaction.status,
                                )}
                              >
                                {financialTransactionStatusLabels[transaction.status]}
                              </Badge>
                            )}

                            <span className="text-xs text-muted-foreground">
                              {financialTransactionSourceLabels[transaction.source]}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {formatDate(transaction.settlementDate) ?? "-"}
                            </span>
                            {transaction.dueDate && (
                              <span className="flex items-center text-xs text-muted-foreground">
                                <CalendarDays className="mr-1 size-3" />
                                venc. {formatDate(transaction.dueDate)}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge
                            className={getFinancialTransactionTypeBadgeClass(
                              transaction.type,
                            )}
                          >
                            {transaction.type === "TRANSFER" && transaction.transferDirection
                              ? `${financialTransactionTypeLabels[transaction.type]} · ${transferDirectionLabels[transaction.transferDirection]
                              }`
                              : financialTransactionTypeLabels[transaction.type]}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <div className="max-w-[320px]">
                            <p className="truncate font-medium">
                              {displayDescription}
                            </p>

                            {transaction.description?.trim() &&
                              transaction.rawDescription?.trim() &&
                              transaction.rawDescription !== transaction.description && (
                                <p className="truncate text-xs text-muted-foreground">
                                  Banco: {transaction.rawDescription}
                                </p>
                              )}

                            {!transaction.description?.trim() &&
                              transaction.rawDescription && (
                                <p className="truncate text-xs text-muted-foreground">
                                  Descrição original do banco
                                </p>
                              )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-col">
                            <span className="truncate font-medium">
                              {transaction.account.name}
                            </span>

                            {transaction.type === "TRANSFER" &&
                              transaction.transferCounterpartyAccount && (
                                <span className="truncate text-xs text-muted-foreground">
                                  {transaction.transferDirection === "OUT"
                                    ? `Para: ${transaction.transferCounterpartyAccount.name}`
                                    : `De: ${transaction.transferCounterpartyAccount.name}`}
                                </span>
                              )}

                            {transaction.type !== "TRANSFER" && transaction.account.bankName && (
                              <span className="truncate text-xs text-muted-foreground">
                                {transaction.account.bankName}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex max-w-[170px] flex-col">
                            <span className="truncate">
                              {transaction.category?.name ?? "-"}
                            </span>
                            {transaction.category?.parentName && (
                              <span className="truncate text-xs text-muted-foreground">
                                {transaction.category.parentName}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="text-right font-semibold">
                          {transaction.settledAmount !== null
                            ? formatCurrency(Math.abs(transaction.settledAmount))
                            : formatCurrency(Math.abs(transaction.expectedAmount))}
                        </TableCell>

                        <TableCell>
                          <AllocationBadge status={allocationStatus} />
                        </TableCell>

                        <TableCell>
                          <AttachmentBadge
                            transaction={transaction}
                            settings={settingsQuery.data}
                          />
                        </TableCell>

                        <TableCell onClick={(event) => event.stopPropagation()}>
                          <FinancialTransactionActions transaction={transaction} />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {transactionToView && (
        <ViewFinancialTransactionDialog
          transaction={transactionToView}
          open={Boolean(transactionToView)}
          onOpenChange={(open) => {
            if (!open) setTransactionToView(null)
          }}
          trigger={null}
        />
      )}

      {transactionToClassify && (
        <ClassifyFinancialTransactionDialog
          transaction={transactionToClassify}
          open={Boolean(transactionToClassify)}
          onOpenChange={(open) => {
            if (!open) setTransactionToClassify(null)
          }}
          trigger={null}
        />
      )}
    </>
  )
}

type AllocationStatus = "NOT_APPLICABLE" | "FULL" | "PARTIAL" | "NONE"

function getAllocationStatus(transaction: FinancialTransaction): AllocationStatus {
  if (transaction.type === "TRANSFER") {
    return "NOT_APPLICABLE"
  }

  if (transaction.status !== "SETTLED") {
    return "NOT_APPLICABLE"
  }

  const totalAllocated = transaction.allocations.reduce(
    (total, allocation) => total + Math.abs(allocation.amount),
    0,
  )

  const settledAmount = Math.abs(transaction.settledAmount ?? 0)

  if (settledAmount <= 0) {
    return "NOT_APPLICABLE"
  }

  const difference = Math.abs(totalAllocated - settledAmount)

  if (difference < 0.01) {
    return "FULL"
  }

  if (totalAllocated > 0) {
    return "PARTIAL"
  }

  return "NONE"
}

function AllocationBadge({ status }: { status: AllocationStatus }) {
  if (status === "NOT_APPLICABLE") {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        -
      </Badge>
    )
  }

  if (status === "FULL") {
    return (
      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
        <CheckCircle2 className="mr-1 size-3" />
        Alocada
      </Badge>
    )
  }

  if (status === "PARTIAL") {
    return (
      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
        <CircleDollarSign className="mr-1 size-3" />
        Parcial
      </Badge>
    )
  }

  return (
    <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
      <AlertCircle className="mr-1 size-3" />
      A alocar
    </Badge>
  )
}

function AttachmentBadge({
  transaction,
  settings,
}: {
  transaction: FinancialTransaction
  settings?: OrganizationSettings
}) {
  const attachmentCount = transaction.attachmentCount ?? 0

  const documentation = getTransactionDocumentationStatus(
    transaction,
    settings,
  )

  if (documentation.status === "NOT_REQUIRED") {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        -
      </Badge>
    )
  }

  if (documentation.status === "WAIVED") {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Disp.
      </Badge>
    )
  }

  if (documentation.status === "MISSING_DECLARED") {
    return (
      <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">
        <FileWarning className="mr-1 size-3" />
        Just.
      </Badge>
    )
  }

  if (documentation.status === "MISSING") {
    return (
      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
        <FileWarning className="mr-1 size-3" />
        Docs
      </Badge>
    )
  }

  if (documentation.status === "PARTIAL") {
    return (
      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
        <FileWarning className="mr-1 size-3" />
        Parcial
      </Badge>
    )
  }

  return (
    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
      <FileCheck2 className="mr-1 size-3" />
      {attachmentCount}
    </Badge>
  )
}