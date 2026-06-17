import { ArrowRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency, formatDate } from "@/utils/formatters"
import type { FundTransfer } from "../fund-types"
import { CancelFundTransferDialog } from "./cancel-fund-transfer-dialog"

type FundTransfersTableProps = {
  transfers: FundTransfer[]
  canFinanceWrite: boolean
}

export function FundTransfersTable({
  transfers,
  canFinanceWrite,
}: FundTransfersTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de transferências entre fundos</CardTitle>
        <CardDescription>
          Movimentações internas que ajustam saldos de fundos sem alterar
          contas bancárias, receitas, despesas ou alocações originais.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {transfers.length === 0 ? (
          <div className="flex h-40 items-center justify-center rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground">
              Nenhuma transferência entre fundos registrada ainda.
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead />
                  <TableHead>Destino</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[90px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {transfers.map((transfer) => (
                  <TableRow key={transfer.id}>
                    <TableCell>
                      {formatDate(transfer.transferDate)}
                    </TableCell>

                    <TableCell className="font-medium">
                      {transfer.sourceFund.name}
                    </TableCell>

                    <TableCell className="w-8 text-muted-foreground">
                      <ArrowRight className="size-4" />
                    </TableCell>

                    <TableCell className="font-medium">
                      {transfer.destinationFund.name}
                    </TableCell>

                    <TableCell className="text-right font-medium">
                      {formatCurrency(transfer.amount)}
                    </TableCell>

                    <TableCell className="max-w-[280px] truncate text-muted-foreground">
                      {transfer.description || "-"}
                    </TableCell>

                    <TableCell>
                      {transfer.status === "ACTIVE" ? (
                        <Badge>Ativa</Badge>
                      ) : (
                        <Badge variant="secondary">Cancelada</Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      {canFinanceWrite && transfer.status === "ACTIVE" ? (
                        <CancelFundTransferDialog transfer={transfer} />
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}