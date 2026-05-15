
import { accountTypeLabels } from "@/features/accounts/account-labels"
import type { Account } from "@/features/accounts/types"
import { formatCurrency } from "@/utils/formatters"
import { AccountActions } from "@/features/accounts/components/account-actions"

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

type AccountsTableProps = {
  accounts: Account[]
}

export function AccountsTable({ accounts }: AccountsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contas cadastradas</CardTitle>
      </CardHeader>

      <CardContent>
        {accounts.length === 0 ? (
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground">
              Nenhuma conta cadastrada ainda.
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Banco</TableHead>
                  <TableHead>Agência</TableHead>
                  <TableHead>Conta</TableHead>
                  <TableHead className="text-right">Saldo inicial</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>

              <TableBody>
                {accounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">
                      {account.name}
                    </TableCell>

                    <TableCell>
                      {accountTypeLabels[account.type]}
                    </TableCell>

                    <TableCell>
                      {account.bankName ?? "-"}
                    </TableCell>

                    <TableCell>
                      {account.agency ?? "-"}
                    </TableCell>

                    <TableCell>
                      {account.accountNumber ?? "-"}
                    </TableCell>

                    <TableCell className="text-right font-medium">
                      {formatCurrency(account.initialBalance)}
                    </TableCell>

                    <TableCell>
                      {account.active ? (
                        <Badge>Ativa</Badge>
                      ) : (
                        <Badge variant="secondary">Inativa</Badge>
                      )}
                    </TableCell>

                    <TableCell>
                      <AccountActions account={account} />
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