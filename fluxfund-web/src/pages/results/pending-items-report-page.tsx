import type { ComponentType } from "react"
import {
  AlertTriangle,
  ArrowLeft,
  ClipboardList,
  CreditCard,
  FileWarning,
  FolderKanban,
  ListChecks,
} from "lucide-react"
import { Link } from "react-router-dom"

import { PageHeader } from "@/components/layout/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { usePendingItemsReport } from "@/features/reports/hooks/use-pending-items-report"
import type {
  PendingCreditCardStatementItem,
  PendingFundItem,
  PendingTransactionItem,
} from "@/features/reports/reports-types"
import { formatCurrency, formatDate } from "@/utils/formatters"

export function PendingItemsReportPage() {
  const { data: report, isLoading, isError } = usePendingItemsReport({
    limit: 10,
  })

  const totalPending =
    (report?.unclassifiedCount ?? 0) +
    (report?.unallocatedCount ?? 0) +
    (report?.missingDocumentsCount ?? 0) +
    (report?.pendingCreditCardStatementsCount ?? 0) +
    (report?.negativeFundsCount ?? 0)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Button asChild variant="ghost" className="px-0">
          <Link to="/reports">
            <ArrowLeft className="mr-2 size-4" />
            Voltar para relatórios
          </Link>
        </Button>

        <div className="rounded-lg border p-6 text-sm text-muted-foreground">
          Carregando pendências operacionais...
        </div>
      </div>
    )
  }

  if (isError || !report) {
    return (
      <div className="space-y-6">
        <Button asChild variant="ghost" className="px-0">
          <Link to="/reports">
            <ArrowLeft className="mr-2 size-4" />
            Voltar para relatórios
          </Link>
        </Button>

        <div className="rounded-lg border p-6 text-sm text-destructive">
          Não foi possível carregar as pendências operacionais.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" className="px-0">
        <Link to="/reports">
          <ArrowLeft className="mr-2 size-4" />
          Voltar para relatórios
        </Link>
      </Button>

      <PageHeader
        title="Pendências operacionais"
        description="Central diária para conferir transações, alocações, documentos, faturas e fundos que precisam de atenção."
      >
        <Button variant="outline" asChild>
          <Link to="/transactions">Ir para transações</Link>
        </Button>
      </PageHeader>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <PendingMetricCard
          title="A classificar"
          value={report.unclassifiedCount}
          icon={ClipboardList}
        />

        <PendingMetricCard
          title="A alocar"
          value={report.unallocatedCount}
          icon={ListChecks}
        />

        <PendingMetricCard
          title="Sem documento"
          value={report.missingDocumentsCount}
          icon={FileWarning}
        />

        <PendingMetricCard
          title="Faturas a pagar"
          value={report.pendingCreditCardStatementsCount}
          icon={CreditCard}
        />

        <PendingMetricCard
          title="Fundos negativos"
          value={report.negativeFundsCount}
          icon={FolderKanban}
        />
      </section>

      {totalPending === 0 ? (
        <Card>
          <CardContent className="flex min-h-56 flex-col items-center justify-center gap-3 text-center">
            <div className="rounded-full bg-emerald-100 p-3">
              <ListChecks className="size-6 text-emerald-700" />
            </div>

            <div>
              <p className="font-medium">Nenhuma pendência encontrada</p>
              <p className="text-sm text-muted-foreground">
                As principais conferências operacionais estão em dia.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <section className="grid gap-4 xl:grid-cols-2">
          <TransactionPendingCard
            title="Transações a classificar"
            description="Lançamentos sem categoria que precisam de conferência."
            items={report.unclassifiedTransactions}
            actionLabel="Ver a classificar"
            actionHref="/transactions?onlyUnclassified=true"
            itemAction="classify"
          />

          <TransactionPendingCard
            title="Transações a alocar"
            description="Lançamentos liquidados que ainda não foram totalmente destinados aos fundos."
            items={report.unallocatedTransactions}
            actionLabel="Ver a alocar"
            actionHref="/transactions?onlyUnallocated=true"
            itemAction="allocate"
          />

          <TransactionPendingCard
            title="Documentos obrigatórios ausentes"
            description="Transações liquidadas que descumpriram regra fiscal, comprovante obrigatório ou ausência declarada."
            items={report.missingDocumentTransactions}
            actionLabel="Ver transações"
            actionHref="/transactions"
            itemAction="attachments"
          />

          <CreditCardPendingCard
            items={report.pendingCreditCardStatements}
          />

          <FundPendingCard items={report.negativeFunds} />
        </section>
      )}
    </div>
  )
}

type PendingMetricCardProps = {
  title: string
  value: number
  icon: ComponentType<{ className?: string }>
}

function PendingMetricCard({
  title,
  value,
  icon: Icon,
}: PendingMetricCardProps) {
  const hasPending = value > 0

  return (
    <Card className={hasPending ? "border-amber-200" : undefined}>
      <CardContent className="flex items-center justify-between gap-4 p-4">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold">{value}</p>
        </div>

        <div className="rounded-lg bg-muted p-2">
          <Icon className="size-5 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  )
}

type TransactionPendingCardProps = {
  title: string
  description: string
  items: PendingTransactionItem[]
  actionLabel: string
  actionHref: string
  itemAction: "view" | "classify" | "allocate" | "attachments"
}

function TransactionPendingCard({
  title,
  description,
  items,
  actionLabel,
  actionHref,
  itemAction,
}: TransactionPendingCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>

        <Button variant="outline" size="sm" asChild>
          <Link to={actionHref}>{actionLabel}</Link>
        </Button>
      </CardHeader>

      <CardContent>
        {items.length === 0 ? (
          <EmptyPendingState />
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Conta</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-[90px]" />
                </TableRow>
              </TableHeader>

              <TableBody>
                {items.map((item) => {
                  const description =
                    item.description || item.rawDescription || "-"

                  return (
                    <TableRow key={`${item.id}-${item.reason}`}>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(item.date)}
                      </TableCell>

                      <TableCell>
                        <div className="max-w-[260px] truncate font-medium">
                          {description}
                        </div>

                        <div className="text-xs text-muted-foreground">
                          {item.reason}
                        </div>

                        {item.categoryName && (
                          <div className="text-xs text-muted-foreground">
                            Categoria: {item.categoryName}
                          </div>
                        )}
                      </TableCell>

                      <TableCell>{item.accountName}</TableCell>

                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.amount)}
                      </TableCell>

                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link
                            to={`/transactions?transactionId=${item.id}&action=${itemAction}`}
                          >
                            Abrir
                          </Link>
                        </Button>
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
  )
}

function CreditCardPendingCard({
  items,
}: {
  items: PendingCreditCardStatementItem[]
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle>Faturas a pagar</CardTitle>
          <CardDescription>
            Faturas com ciclo fechado que ainda aguardam pagamento.
          </CardDescription>
        </div>

        <Button variant="outline" size="sm" asChild>
          <Link to="/credit-card-statements">Ver faturas</Link>
        </Button>
      </CardHeader>

      <CardContent>
        {items.length === 0 ? (
          <EmptyPendingState />
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-4 rounded-lg border p-3"
              >
                <div className="space-y-1">
                  <p className="font-medium">{item.name}</p>

                  <p className="text-sm text-muted-foreground">
                    {item.accountName} · vencimento {formatDate(item.dueDate)}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{item.status}</Badge>

                    {item.pendingItemsCount > 0 && (
                      <Badge variant="outline">
                        {item.pendingItemsCount} itens pendentes
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-medium">
                    {formatCurrency(item.totalAmount)}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {item.reason}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function FundPendingCard({ items }: { items: PendingFundItem[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle>Fundos negativos</CardTitle>
          <CardDescription>
            Fundos cujo saldo interno está abaixo de zero.
          </CardDescription>
        </div>

        <Button variant="outline" size="sm" asChild>
          <Link to="/reports/funds">Ver fundos</Link>
        </Button>
      </CardHeader>

      <CardContent>
        {items.length === 0 ? (
          <EmptyPendingState />
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-4 rounded-lg border p-3"
              >
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.reason}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <AlertTriangle className="size-4 text-destructive" />

                  <span className="font-medium text-destructive">
                    {formatCurrency(item.currentBalance)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function EmptyPendingState() {
  return (
    <div className="flex h-28 items-center justify-center rounded-lg border border-dashed">
      <p className="text-sm text-muted-foreground">
        Nenhuma pendência nesta seção.
      </p>
    </div>
  )
}