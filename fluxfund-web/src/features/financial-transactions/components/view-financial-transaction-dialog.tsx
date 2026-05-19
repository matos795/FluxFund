import { Eye } from "lucide-react"
import { useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
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
  TableRow,
} from "@/components/ui/table"

import type { FinancialTransaction } from "@/features/financial-transactions/financial-transaction-types"
import {
  financialTransactionSourceLabels,
  financialTransactionStatusLabels,
  financialTransactionTypeLabels,
} from "@/features/financial-transactions/financial-transaction-labels"
import {
  getFinancialTransactionStatusBadgeClass,
  getFinancialTransactionTypeBadgeClass,
} from "@/features/financial-transactions/financial-transaction-badge-styles"
import { formatCurrency, formatDate } from "@/utils/formatters"

type ViewFinancialTransactionDialogProps = {
  transaction: FinancialTransaction
}

export function ViewFinancialTransactionDialog({
  transaction,
}: ViewFinancialTransactionDialogProps) {
  const [open, setOpen] = useState(false)

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
    <>
      <DropdownMenuItem
        onSelect={(event) => {
          event.preventDefault()
          setOpen(true)
        }}
      >
        <Eye className="mr-2 size-4" />
        Detalhes
      </DropdownMenuItem>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Detalhes da transação</DialogTitle>
            <DialogDescription>
              Visualize os dados completos da transação financeira.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <section className="grid gap-3 md:grid-cols-4">
              <SummaryCard
                label="Descrição"
                value={
                  transaction.description?.trim() ||
                  transaction.rawDescription?.trim() ||
                  "-"
                }
              />
              <SummaryCard
                label="Valor previsto"
                value={formatCurrency(transaction.expectedAmount)}
              />
              <SummaryCard
                label="Valor baixado"
                value={
                  transaction.settledAmount !== null
                    ? formatCurrency(transaction.settledAmount)
                    : "-"
                }
              />
              <SummaryCard
                label="Total alocado"
                value={formatCurrency(totalAllocated)}
              />
            </section>

            <section className="rounded-lg border p-4">
              <h3 className="mb-3 text-sm font-medium">Classificação</h3>

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
            </section>

            <section className="rounded-lg border p-4">
              <h3 className="mb-3 text-sm font-medium">Conta</h3>

              <div className="grid gap-4 md:grid-cols-2">
                <DetailItem label="Conta" value={transaction.account.name} />
                <DetailItem
                  label="Tipo da conta"
                  value={transaction.account.type}
                />
                <DetailItem
                  label="Banco"
                  value={transaction.account.bankName ?? "-"}
                />
              </div>
            </section>

            <section className="rounded-lg border p-4">
              <h3 className="mb-3 text-sm font-medium">Datas e valores</h3>

              <div className="grid gap-4 md:grid-cols-2">
                <DetailItem
                  label="Data de vencimento"
                  value={formatDate(transaction.dueDate)}
                />
                <DetailItem
                  label="Data de baixa"
                  value={formatDate(transaction.settlementDate)}
                />
                <DetailItem
                  label="Valor previsto"
                  value={formatCurrency(transaction.expectedAmount)}
                />
                <DetailItem
                  label="Valor baixado"
                  value={
                    transaction.settledAmount !== null
                      ? formatCurrency(transaction.settledAmount)
                      : "-"
                  }
                />
                <DetailItem
                  label="Juros"
                  value={formatCurrency(transaction.interestAmount)}
                />
                <DetailItem
                  label="Desconto"
                  value={formatCurrency(transaction.discountAmount)}
                />
              </div>
            </section>

            <section className="rounded-lg border p-4">
              <h3 className="mb-3 text-sm font-medium">Documento e descrição</h3>

              <div className="grid gap-4">
                <DetailItem
                  label="Número do documento"
                  value={transaction.documentNumber ?? "-"}
                />

                <DetailItem
                  label="Descrição interna"
                  value={transaction.description?.trim() || "-"}
                />

                <DetailItem
                  label="Descrição original do banco"
                  value={transaction.rawDescription?.trim() || "-"}
                />

                <DetailItem
                  label="ID externo"
                  value={transaction.externalId ?? "-"}
                />
              </div>
            </section>

            <section className="rounded-lg border p-4">
              <h3 className="mb-3 text-sm font-medium">Alocações</h3>

              <div className="mb-4 grid gap-3 md:grid-cols-3">
                <SummaryCard
                  label="Valor baixado"
                  value={formatCurrency(settledAmount)}
                />
                <SummaryCard
                  label="Total alocado"
                  value={formatCurrency(totalAllocated)}
                />
                <SummaryCard
                  label="Restante"
                  value={formatCurrency(remainingAmount)}
                />
              </div>

              {transaction.allocations.length === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                  Nenhuma alocação cadastrada.
                </p>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableBody>
                      {transaction.allocations.map((allocation) => (
                        <TableRow key={allocation.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {allocation.fund.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Fundo
                              </span>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex flex-col">
                              <span>
                                {allocation.beneficiary?.name ?? "-"}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Favorecido
                              </span>
                            </div>
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
            </section>

            <section className="rounded-lg border p-4">
              <h3 className="mb-3 text-sm font-medium">Controle</h3>

              <div className="grid gap-4 md:grid-cols-2">
                <DetailItem
                  label="Importado em"
                  value={formatDateTime(transaction.importedAt)}
                />
                <DetailItem
                  label="Classificado em"
                  value={formatDateTime(transaction.classifiedAt)}
                />
                <DetailItem
                  label="Criado em"
                  value={formatDateTime(transaction.createdAt)}
                />
                <DetailItem
                  label="Atualizado em"
                  value={formatDateTime(transaction.updatedAt)}
                />
              </div>
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </>
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

type SummaryCardProps = {
  label: string
  value: React.ReactNode
}

function SummaryCard({ label, value }: SummaryCardProps) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="truncate text-sm font-medium">{value}</div>
    </div>
  )
}

function formatDateTime(date: string | null | undefined) {
  if (!date) {
    return "-"
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date))
}