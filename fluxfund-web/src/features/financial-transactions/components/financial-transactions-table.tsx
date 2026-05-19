import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { FinancialTransaction } from "../financial-transaction-types"
import { formatCurrency, formatDate } from "@/utils/formatters"
import { financialTransactionStatusLabels, financialTransactionTypeLabels } from "../financial-transaction-labels"
import { FinancialTransactionActions } from "./financial-transaction-actions"
import { getFinancialTransactionStatusBadgeClass, getFinancialTransactionTypeBadgeClass } from "../financial-transaction-badge-styles"

type FinancialTransactionsTableProps = {
    financialTransactions: FinancialTransaction[]
}

export function FinancialTransactionsTable({ financialTransactions }: FinancialTransactionsTableProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Lançamentos financeiros</CardTitle>
            </CardHeader>

            <CardContent>
                {financialTransactions.length === 0 ? (
                    <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
                        <p className="text-sm text-muted-foreground">
                            Nenhuma transação cadastrada ainda.
                        </p>
                    </div>
                ) : (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Conta</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Descrição</TableHead>
                                    <TableHead>Categoria</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Baixado</TableHead>
                                    <TableHead>Baixa</TableHead>
                                    <TableHead>Alocado?</TableHead>
                                    <TableHead className="w-[50px]" />
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {financialTransactions.map((transaction) => {
                                    const totalAllocated = transaction.allocations.reduce(
                                        (total, allocation) => total + allocation.amount,
                                        0,
                                    )

                                    const settledAmount = transaction.settledAmount ?? 0

                                    const allocationDifference =
                                        Math.abs(Math.abs(totalAllocated) - Math.abs(settledAmount))

                                    const isFullyAllocated =
                                        transaction.status === "SETTLED" && allocationDifference < 0.01

                                    const isPartiallyAllocated =
                                        transaction.status === "SETTLED" && Math.abs(totalAllocated) > 0 && !isFullyAllocated

                                    const displayDescription =
                                        transaction.description?.trim() ||
                                        transaction.rawDescription?.trim() ||
                                        "-"

                                    return (
                                        <TableRow key={transaction.id}>

                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span>{transaction.account.name}</span>
                                                    {transaction.account.bankName && (
                                                        <span className="text-xs text-muted-foreground">
                                                            {transaction.account.bankName}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <Badge className={getFinancialTransactionTypeBadgeClass(transaction.type)}>
                                                    {financialTransactionTypeLabels[transaction.type]}
                                                </Badge>
                                            </TableCell>

                                            <TableCell className="font-medium">
                                                <div className="flex flex-col">
                                                    <span>{displayDescription}</span>

                                                    {!transaction.description?.trim() && transaction.rawDescription && (
                                                        <span className="text-xs text-muted-foreground">
                                                            Descrição original do banco
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span>{transaction.category?.name ?? "-"}</span>
                                                    {transaction.category?.parentName && (
                                                        <span className="text-xs text-muted-foreground">
                                                            {transaction.category.parentName}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <Badge className={getFinancialTransactionStatusBadgeClass(transaction.status)}>
                                                    {financialTransactionStatusLabels[transaction.status]}
                                                </Badge>
                                            </TableCell>

                                            <TableCell className="font-medium">
                                                {transaction.settledAmount !== null
                                                    ? formatCurrency(transaction.settledAmount)
                                                    : "-"}
                                            </TableCell>

                                            <TableCell>{formatDate(transaction.settlementDate) ?? "-"}</TableCell>

                                            <TableCell>
                                                {transaction.status !== "SETTLED" ? (
                                                    <Badge variant="outline">Não aplicável</Badge>
                                                ) : isFullyAllocated ? (
                                                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                                                        Sim
                                                    </Badge>
                                                ) : isPartiallyAllocated ? (
                                                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                                                        Parcial
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline">Não</Badge>
                                                )}
                                            </TableCell>

                                            <TableCell>
                                                <FinancialTransactionActions
                                                    transaction={transaction}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )
                }
            </CardContent>
        </Card>
    )
}