import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { FinancialTransaction } from "../financial-transaction-types"
import { formatCurrency } from "@/utils/formatters"
import { financialTransactionStatusLabels, financialTransactionTypeLabels } from "../financial-transaction-labels"
import { FinancialTransactionActions } from "./financial-transaction-actions"


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
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Descrição</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Conta</TableHead>
                                    <TableHead>Categoria</TableHead>
                                    <TableHead className="text-right">Previsto</TableHead>
                                    <TableHead className="text-right">Baixado</TableHead>
                                    <TableHead>Vencimento</TableHead>
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
                                    const isFullyAllocated = settledAmount > 0 && totalAllocated === settledAmount

                                    return (
                                        <TableRow key={transaction.id}>

                                            <TableCell>
                                                {financialTransactionTypeLabels[transaction.type]}
                                            </TableCell>

                                            <TableCell className="font-medium">
                                                {transaction.description}
                                            </TableCell>
                                            
                                            <TableCell>
                                                <Badge variant="secondary">
                                                    {financialTransactionStatusLabels[transaction.status]}
                                                </Badge>
                                            </TableCell>

                                            <TableCell>{transaction.account.name}</TableCell>

                                            <TableCell>{transaction.category?.name ?? "-"}</TableCell>

                                            <TableCell className="text-right font-medium">
                                                {formatCurrency(transaction.expectedAmount)}
                                            </TableCell>

                                            <TableCell className="text-right font-medium">
                                                {transaction.settledAmount ? formatCurrency(transaction.settledAmount) : "-"}
                                            </TableCell>

                                            <TableCell>{transaction.dueDate ?? "-"}</TableCell>

                                            <TableCell>{transaction.settlementDate ?? "-"}</TableCell>

                                            <TableCell>
                                                {isFullyAllocated ? (
                                                    <Badge>Sim</Badge>
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