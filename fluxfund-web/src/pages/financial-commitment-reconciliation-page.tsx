import {
  useMemo,
  useState,
} from "react"

import {
  AlertTriangle,
  CheckCircle2,
  History,
  SearchX,
} from "lucide-react"

import {
  toast,
} from "sonner"

import {
  PageHeader,
} from "@/components/layout/page-header"

import {
  PagePagination,
} from "@/components/pagination/page-pagination"

import {
  Button,
} from "@/components/ui/button"

import {
  Card,
  CardContent,
} from "@/components/ui/card"

import {
  Input,
} from "@/components/ui/input"

import {
  Label,
} from "@/components/ui/label"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  CommitmentsWorkspaceNav,
} from "@/features/financial-commitments/components/commitments-workspace-nav"

import {
  FinancialCommitmentReconciliationCard,
} from "@/features/financial-commitments/components/financial-commitment-reconciliation-card"

import {
  useFinancialCommitmentReconciliation,
} from "@/features/financial-commitments/hooks/use-financial-commitment-reconciliation"

import {
  useLinkFinancialCommitmentReconciliation,
} from "@/features/financial-commitments/hooks/use-link-financial-commitment-reconciliation"

import {
  getApiErrorMessage,
} from "@/utils/api-error"

const PAGE_SIZE = 8

function getCurrentMonth() {
  const now =
    new Date()

  const month =
    String(
      now.getMonth() + 1,
    ).padStart(2, "0")

  return `${now.getFullYear()}-${month}`
}

function getCurrentYearStart() {
  return `${new Date().getFullYear()}-01`
}

export function FinancialCommitmentReconciliationPage() {
  const [page, setPage] =
    useState(0)

  const [
    startMonth,
    setStartMonth,
  ] = useState(
    getCurrentYearStart(),
  )

  const [
    endMonth,
    setEndMonth,
  ] = useState(
    getCurrentMonth(),
  )

  const [
    transactionType,
    setTransactionType,
  ] = useState<
    | "INCOME"
    | "EXPENSE"
    | ""
  >("")

  const query =
    useFinancialCommitmentReconciliation({
      startMonth,
      endMonth,

      transactionType:
        transactionType ||
        undefined,

      page,
      size:
        PAGE_SIZE,
    })

  const linkMutation =
    useLinkFinancialCommitmentReconciliation()

  const items =
    query.data?.content ?? []

  const counts =
    useMemo(
      () => ({
        exact:
          items.filter(
            (item) =>
              item.matchStatus ===
              "EXACT",
          ).length,

        review:
          items.filter(
            (item) =>
              item.matchStatus ===
              "REVIEW",
          ).length,

        noMatch:
          items.filter(
            (item) =>
              item.matchStatus ===
              "NO_MATCH",
          ).length,
      }),
      [items],
    )

  function handleLink(
    transactionId: string,
    allocationId: string,
    financialCommitmentId: string,
  ) {
    linkMutation.mutate(
      {
        transactionId,
        allocationId,
        financialCommitmentId,
      },
      {
        onSuccess: () => {
          toast.success(
            "Alocação vinculada ao compromisso.",
          )
        },

        onError: (error) => {
          toast.error(
            getApiErrorMessage(
              error,
              "Não foi possível confirmar o vínculo.",
            ),
          )
        },
      },
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reconciliação histórica"
        description="Revise alocações antigas e associe somente aquelas que realizam compromissos financeiros genéricos."
      />

      <CommitmentsWorkspaceNav />

      <div className="overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-background p-6">
        <div className="flex max-w-3xl gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <History className="size-6" />
          </div>

          <div>
            <h2 className="text-lg font-semibold">
              Deixe os relatórios históricos confiáveis
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              O FluxFund procura compromissos compatíveis usando contato, destinatário, fundo, competência e valor. Nenhum vínculo é realizado sem sua confirmação.
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="grid gap-4 p-5 md:grid-cols-[1fr_1fr_220px_auto] md:items-end">
          <div className="space-y-2">
            <Label>
              Competência inicial
            </Label>

            <Input
              type="month"
              value={
                startMonth
              }
              onChange={(event) => {
                setStartMonth(
                  event.target.value,
                )
                setPage(0)
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>
              Competência final
            </Label>

            <Input
              type="month"
              value={
                endMonth
              }
              onChange={(event) => {
                setEndMonth(
                  event.target.value,
                )
                setPage(0)
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>
              Tipo de movimentação
            </Label>

            <Select
              value={
                transactionType ||
                "ALL"
              }
              onValueChange={(value) => {
                setTransactionType(
                  value === "ALL"
                    ? ""
                    : value as
                      | "INCOME"
                      | "EXPENSE",
                )

                setPage(0)
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="ALL">
                  Receitas e despesas
                </SelectItem>

                <SelectItem value="INCOME">
                  Somente receitas
                </SelectItem>

                <SelectItem value="EXPENSE">
                  Somente despesas
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setStartMonth(
                getCurrentYearStart(),
              )

              setEndMonth(
                getCurrentMonth(),
              )

              setTransactionType(
                "",
              )

              setPage(0)
            }}
          >
            Limpar filtros
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <CheckCircle2 className="size-5 text-emerald-600" />

            <div>
              <p className="text-2xl font-semibold">
                {counts.exact}
              </p>

              <p className="text-xs text-muted-foreground">
                Exatos nesta página
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="size-5 text-amber-600" />

            <div>
              <p className="text-2xl font-semibold">
                {counts.review}
              </p>

              <p className="text-xs text-muted-foreground">
                Para revisar nesta página
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <SearchX className="size-5 text-muted-foreground" />

            <div>
              <p className="text-2xl font-semibold">
                {counts.noMatch}
              </p>

              <p className="text-xs text-muted-foreground">
                Sem correspondência
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {query.isLoading ? (
        <div className="space-y-4">
          {Array.from({
            length:
              3,
          }).map(
            (_, index) => (
              <div
                key={index}
                className="h-64 animate-pulse rounded-xl border bg-muted/30"
              />
            ),
          )}
        </div>
      ) : query.isError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">
          Não foi possível carregar a reconciliação histórica.
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <CheckCircle2 className="mx-auto size-10 text-emerald-600" />

          <h2 className="mt-4 font-semibold">
            Nenhuma alocação pendente neste período
          </h2>

          <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
            Todas as alocações compatíveis já foram vinculadas ou ainda não possuem informações suficientes para uma sugestão.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <FinancialCommitmentReconciliationCard
              key={
                item.allocationId
              }
              item={
                item
              }
              isLinking={
                linkMutation.isPending &&
                linkMutation.variables
                  ?.allocationId ===
                  item.allocationId
              }
              onLink={(
                financialCommitmentId,
              ) =>
                handleLink(
                  item.transactionId,
                  item.allocationId,
                  financialCommitmentId,
                )
              }
            />
          ))}
        </div>
      )}

      {query.data && (
        <PagePagination
          page={
            query.data.number
          }
          totalPages={
            query.data
              .totalPages
          }
          totalElements={
            query.data
              .totalElements
          }
          size={
            query.data.size
          }
          isFirst={
            query.data.first
          }
          isLast={
            query.data.last
          }
          onPageChange={
            setPage
          }
        />
      )}
    </div>
  )
}