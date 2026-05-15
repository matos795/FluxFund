import { formatCurrency, formatDate } from "@/utils/formatters"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
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
import type { Fund } from "../fund-types"
import { FundActions } from "./fund-actions"

type FundsTableProps = {
  funds: Fund[]
}

export function FundsTable({ funds }: FundsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fundos cadastrados</CardTitle>
      </CardHeader>

      <CardContent>
        {funds.length === 0 ? (
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground">
              Nenhum fundo cadastrado ainda.
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Saldo inicial</TableHead>
                  <TableHead className="text-right">Saldo atual</TableHead>
                  <TableHead>Data de Saldo Inicial</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>

              <TableBody>
                {funds.map((fund) => (
                  <TableRow key={fund.id}>
                    <TableCell className="font-medium">
                      {fund.name}
                    </TableCell>

                    <TableCell>
                      {fund.description ?? "-"}
                    </TableCell>

                    <TableCell className="text-right font-medium">
                      {formatCurrency(fund.initialBalance)}
                    </TableCell>

                    <TableCell className="text-right font-medium">
                      {formatCurrency(fund.currentBalance)}
                    </TableCell>

                    <TableCell>
                      {formatDate(fund.initialBalanceDate)}
                    </TableCell>

                    <TableCell>
                      {fund.active ? (
                        <Badge>Ativa</Badge>
                      ) : (
                        <Badge variant="secondary">Inativa</Badge>
                      )}
                    </TableCell>

                    <TableCell>
                      <FundActions fund={fund} />
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