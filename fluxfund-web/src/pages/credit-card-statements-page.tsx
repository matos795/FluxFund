import { useMemo, useState } from "react"

import { EntityCombobox } from "@/components/form/entity-combobox"
import { PageHeader } from "@/components/layout/page-header"
import { PagePagination } from "@/components/pagination/page-pagination"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAccounts } from "@/features/accounts/hooks/use-accounts"
import { CreateCreditCardStatementDialog } from "@/features/credit-card-statements/components/create-credit-card-statement-dialog"
import { CreditCardStatementsTable } from "@/features/credit-card-statements/components/credit-card-statements-table"
import { creditCardStatementStatusLabels } from "@/features/credit-card-statements/credit-card-statement-labels"
import type { CreditCardStatementStatus } from "@/features/credit-card-statements/credit-card-statement-types"
import { useCreditCardStatements } from "@/features/credit-card-statements/hooks/use-credit-card-statements"
import { usePermissions } from "@/features/auth/hooks/use-permissions"

const ALL_STATUS = "ALL"

type StatusFilter = CreditCardStatementStatus | typeof ALL_STATUS

export function CreditCardStatementsPage() {

  const { canFinanceWrite } = usePermissions()

  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [status, setStatus] = useState<StatusFilter>("OPEN")
  const [creditCardAccountId, setCreditCardAccountId] = useState("")

  const accountsQuery = useAccounts({ page: 0, size: 200 })

  const creditCardAccounts = useMemo(() => {
    return (
      accountsQuery.data?.content.filter(
        (account) => account.type === "CREDIT_CARD",
      ) ?? []
    )
  }, [accountsQuery.data?.content])

  const statementsQuery = useCreditCardStatements({
    page,
    size,
    creditCardAccountId: creditCardAccountId || undefined,
    status: status === ALL_STATUS ? undefined : status,
  })

  const statements = statementsQuery.data?.content ?? []

  return (
    <div>
      <PageHeader
        title="Cartões de crédito"
        description="Gerencie faturas e lance cada compra do cartão como uma despesa individual com categoria, alocação e anexos."
      >
        {canFinanceWrite && <CreateCreditCardStatementDialog />}
      </PageHeader>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>

        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <span className="text-sm font-medium">Cartão</span>
            <EntityCombobox
              value={creditCardAccountId}
              options={creditCardAccounts.map((account) => ({
                value: account.id,
                label: account.bankName
                  ? `${account.name} · ${account.bankName}`
                  : account.name,
              }))}
              placeholder="Todos os cartões"
              searchPlaceholder="Buscar cartão..."
              emptyMessage="Nenhum cartão encontrado."
              allowClear
              clearLabel="Todos os cartões"
              onChange={(value) => {
                setCreditCardAccountId(value)
                setPage(0)
              }}
            />
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium">Status</span>
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value as StatusFilter)
                setPage(0)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value={ALL_STATUS}>Todos</SelectItem>
                {Object.entries(creditCardStatementStatusLabels).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium">Itens por página</span>
            <Select
              value={String(size)}
              onValueChange={(value) => {
                setSize(Number(value))
                setPage(0)
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {[10, 20, 50].map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {statementsQuery.isLoading && (
        <p className="text-sm text-muted-foreground">Carregando faturas...</p>
      )}

      {statementsQuery.isError && (
        <p className="text-sm text-destructive">
          Não foi possível carregar as faturas.
        </p>
      )}

      {!statementsQuery.isLoading && !statementsQuery.isError && (
        <div className="space-y-4">
          <CreditCardStatementsTable statements={statements} />

          {statementsQuery.data && statementsQuery.data.totalPages > 1 && (
            <PagePagination
              page={statementsQuery.data.number}
              totalPages={statementsQuery.data.totalPages}
              totalElements={statementsQuery.data.totalElements}
              size={statementsQuery.data.size}
              isFirst={statementsQuery.data.first}
              isLast={statementsQuery.data.last}
              onPageChange={setPage}
            />
          )}
        </div>
      )}
    </div>
  )
}
