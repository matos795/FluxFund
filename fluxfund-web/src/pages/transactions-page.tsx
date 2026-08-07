import { useEffect, useMemo, useState } from "react"

import { PageHeader } from "@/components/layout/page-header"
import { PagePagination } from "@/components/pagination/page-pagination"
import { FinancialTransactionsTable } from "@/features/financial-transactions/components/financial-transactions-table"
import { useFinancialTransactions } from "@/features/financial-transactions/hooks/use-financial-transactions"
import { CreateFinancialTransactionDialog } from "@/features/financial-transactions/components/create-financial-transaction-dialog"
import { FinancialTransactionFilters } from "@/features/financial-transactions/components/financial-transaction-filters"
import { useSearchParams } from "react-router-dom"
import { ExportSettledFinancialTransactionsDialog } from "@/features/financial-transactions/components/export-settled-financial-transactions-dialog"
import { usePermissions } from "@/features/auth/hooks/use-permissions"
import { useCategoryOptions } from "@/features/categories/hooks/use-category-options"
import { useAccountOptions } from "@/features/accounts/hooks/use-account-options"
import { useFinancialTransaction } from "@/features/financial-transactions/hooks/use-financial-transaction"
import type { TransactionWorkspaceTab } from "@/features/financial-transactions/transaction-workspace-types"
import { needsFinancialTransactionClassification } from "@/features/financial-transactions/financial-transaction-rules"
import { TransactionWorkspaceDialog } from "@/features/financial-transactions/components/transaction-workspace-dialog"
import { ImportFinancialTransactionsDialog } from "@/features/financial-transactions/components/import-financial-transactions-dialog"
import type { DateRangeValue } from "@/components/filters/date-range-presets"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"


const ALL_SETTLEMENT_DATE_PERIOD: DateRangeValue = {
  preset: "all",
  startDate: "",
  endDate: "",
}

function getInitialSettlementDatePeriod(
  searchParams: URLSearchParams,
): DateRangeValue {
  const startDate = searchParams.get("settlementDateFrom") ?? ""
  const endDate = searchParams.get("settlementDateTo") ?? ""

  if (!startDate && !endDate) {
    return ALL_SETTLEMENT_DATE_PERIOD
  }

  return {
    preset: "custom",
    startDate,
    endDate,
  }
}

export function TransactionsPage() {

  const { canFinanceWrite } = usePermissions()

  const [searchParams, setSearchParams] = useSearchParams()

  const actionTransactionId = searchParams.get("transactionId")
  const action = searchParams.get("action") ?? "view"

  const isValidAction =
    action === "view" ||
    action === "classify" ||
    action === "allocate" ||
    action === "attachments"

  const resolvedAction = isValidAction ? action : "view"

  const safeResolvedAction =
    canFinanceWrite ? resolvedAction : "view"

  const directWorkspaceTab: TransactionWorkspaceTab =
    safeResolvedAction === "classify"
      ? "classify"
      : safeResolvedAction === "allocate"
        ? "allocations"
        : safeResolvedAction === "attachments"
          ? "attachments"
          : "overview"

  const directDialogKey = useMemo(() => {
    if (!actionTransactionId) {
      return null
    }

    return `${actionTransactionId}:${safeResolvedAction}`
  }, [actionTransactionId, safeResolvedAction])

  const [page, setPage] = useState(0)
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<Set<string>>(() => new Set())
  const [size, setSize] = useState(10)
  const [sort, setSort] = useState("settlementDate,desc")
  const [fundId, setFundId] = useState(searchParams.get("fundId") ?? "")

  const [type, setType] = useState(searchParams.get("type") ?? "")
  const [status, setStatus] = useState(searchParams.get("status") ?? "")
  const [accountId, setAccountId] = useState(searchParams.get("accountId") ?? "")
  const [categoryId, setCategoryId] = useState(searchParams.get("categoryId") ?? "")
  const [description, setDescription] = useState(searchParams.get("description") ?? "")

  const [settlementDatePeriod, setSettlementDatePeriod] =
    useState<DateRangeValue>(() =>
      getInitialSettlementDatePeriod(searchParams),
    )

  const {
    startDate: settlementDateFrom,
    endDate: settlementDateTo,
  } = settlementDatePeriod

  const [source, setSource] = useState(searchParams.get("source") ?? "")
  const [onlyUnclassified, setOnlyUnclassified] = useState(
    searchParams.get("onlyUnclassified") === "true",
  )
  const [onlyUnallocated, setOnlyUnallocated] = useState(
    searchParams.get("onlyUnallocated") === "true",
  )

  const [directDialogOpen, setDirectDialogOpen] = useState(false)
  const [directWorkspaceTabState, setDirectWorkspaceTabState] =
    useState<TransactionWorkspaceTab>(directWorkspaceTab)

  const [openedDirectDialogKey, setOpenedDirectDialogKey] = useState<
    string | null
  >(null)

  const { data, isLoading, isError } = useFinancialTransactions({
    page,
    size,
    sort,
    type,
    status,
    source,
    accountId,
    categoryId,
    fundId,
    description,
    settlementDateFrom,
    settlementDateTo,
    onlyUnclassified,
    onlyUnallocated,
  })

  const { data: accounts = [] } = useAccountOptions()
  const { data: categories = [] } = useCategoryOptions()

  const { data: directTransaction, isLoading: isDirectTransactionLoading } =
    useFinancialTransaction({
      id: actionTransactionId,
    })

  useEffect(() => {
    if (!directTransaction || !directDialogKey) {
      return
    }

    if (openedDirectDialogKey === directDialogKey) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setDirectWorkspaceTabState(directWorkspaceTab)
      setDirectDialogOpen(true)
      setOpenedDirectDialogKey(directDialogKey)
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [
    directTransaction,
    directDialogKey,
    openedDirectDialogKey,
    directWorkspaceTab,
  ])

  function handleClearFilters() {
    setType("")
    setStatus("")
    setSource("")
    setAccountId("")
    setCategoryId("")
    setFundId("")
    setDescription("")
    setSettlementDatePeriod(ALL_SETTLEMENT_DATE_PERIOD)
    setOnlyUnclassified(false)
    setOnlyUnallocated(false)
    resetPageAndSelection()
    setSearchParams({})
  }

  function clearSelection() {
    setSelectedTransactionIds(new Set())
  }

  function resetPageAndSelection() {
    setPage(0)
    clearSelection()
  }

  function handlePageChange(nextPage: number) {
    clearSelection()
    setPage(nextPage)
  }

  function handleDirectDialogOpenChange(open: boolean) {
    setDirectDialogOpen(open)

    if (open) {
      return
    }

    const nextParams = new URLSearchParams(searchParams)

    nextParams.delete("transactionId")
    nextParams.delete("action")

    setSearchParams(nextParams, {
      replace: true,
    })
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Transações"
        description="Acompanhe lançamentos financeiros, conciliações e movimentações oficiais."
      >
        <div className="flex flex-wrap gap-2">
          {canFinanceWrite && (
            <>
              <ImportFinancialTransactionsDialog />
              <CreateFinancialTransactionDialog />
            </>
          )}
          <ExportSettledFinancialTransactionsDialog />
        </div>
      </PageHeader>

      <FinancialTransactionFilters
        type={type}
        status={status}
        source={source}
        accountId={accountId}
        categoryId={categoryId}
        description={description}
        settlementDatePeriod={settlementDatePeriod}
        onlyUnclassified={onlyUnclassified}
        onlyUnallocated={onlyUnallocated}
        accounts={accounts.map((account) => ({
          id: account.id,
          name: account.label,
        }))}
        categories={categories.map((category) => ({
          id: category.id,
          name: category.label,
        }))}
        onTypeChange={(value) => {
          setType(value)
          resetPageAndSelection()
        }}
        onStatusChange={(value) => {
          setStatus(value)
          resetPageAndSelection()
        }}
        onSourceChange={(value) => {
          setSource(value)
          resetPageAndSelection()
        }}
        onAccountIdChange={(value) => {
          setAccountId(value)
          resetPageAndSelection()
        }}
        onCategoryIdChange={(value) => {
          setCategoryId(value)
          resetPageAndSelection()
        }}
        onDescriptionChange={(value) => {
          setDescription(value)
          resetPageAndSelection()
        }}
        onSettlementDatePeriodChange={(value) => {
          setSettlementDatePeriod(value)
          resetPageAndSelection()
        }}
        onOnlyUnclassifiedChange={(value) => {
          setOnlyUnclassified(value)
          setOnlyUnallocated(false)
          resetPageAndSelection()

          if (value) {
            setSearchParams({
              onlyUnclassified: "true",
            })
          } else {
            setSearchParams({})
          }
        }}
        onOnlyUnallocatedChange={(value) => {
          setOnlyUnallocated(value)
          setOnlyUnclassified(false)
          resetPageAndSelection()

          if (value) {
            setStatus("SETTLED")
            setSearchParams({
              onlyUnallocated: "true",
              status: "SETTLED",
            })
          } else {
            setStatus("")
            setSearchParams({})
          }
        }}
        onClear={handleClearFilters}
      />

      {isLoading && (
        <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
          <p className="text-sm text-muted-foreground">
            Carregando transações...
          </p>
        </div>
      )}

      {isError && (
        <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
          <p className="text-sm text-destructive">
            Não foi possível carregar as transações.
          </p>
        </div>
      )}

      {isDirectTransactionLoading && actionTransactionId && (
        <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
          Abrindo transação selecionada...
        </div>
      )}

      {canFinanceWrite && selectedTransactionIds.size > 0 && (
          <div className="flex flex-col gap-3 rounded-xl border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">
                {
                  selectedTransactionIds
                    .size
                }{" "}
                {selectedTransactionIds
                  .size === 1
                  ? "transação selecionada"
                  : "transações selecionadas"}
              </p>

              <p className="text-xs text-muted-foreground">
                A seleção é limitada à página atual.
              </p>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={
                clearSelection
              }
            >
              <X className="mr-2 size-4" />
              Limpar seleção
            </Button>
          </div>
        )}

      {data && (
        <>
          <FinancialTransactionsTable
            financialTransactions={data.content}
            selectionEnabled={canFinanceWrite}
            selectedTransactionIds={selectedTransactionIds}
            onSelectionChange={setSelectedTransactionIds}
            totalElements={data.totalElements}
            size={size}
            sort={sort}
            onSizeChange={(value) => {
              setSize(value)
              resetPageAndSelection()
            }}
            onSortChange={(value) => {
              setSort(value)
              resetPageAndSelection()
            }}
          />

          <PagePagination
            page={data.number}
            totalPages={data.totalPages}
            totalElements={data.totalElements}
            size={data.size}
            isFirst={data.first}
            isLast={data.last}
            onPageChange={handlePageChange}
          />
        </>
      )}

      {directTransaction && (
        <TransactionWorkspaceDialog
          transaction={directTransaction}
          open={directDialogOpen}
          onOpenChange={handleDirectDialogOpenChange}
          activeTab={directWorkspaceTabState}
          onTabChange={setDirectWorkspaceTabState}
          canEdit={
            canFinanceWrite &&
            directTransaction.status !== "CANCELED" &&
            directTransaction.status !== "IMPORTED" &&
            directTransaction.type !== "TRANSFER" &&
            !needsFinancialTransactionClassification(directTransaction)
          }
          canManageAllocations={
            canFinanceWrite &&
            directTransaction.status === "SETTLED" &&
            directTransaction.type !== "TRANSFER" &&
            !needsFinancialTransactionClassification(directTransaction)
          }
          canManageAttachments={
            canFinanceWrite &&
            directTransaction.status !== "CANCELED" &&
            directTransaction.status !== "IMPORTED" &&
            directTransaction.type !== "TRANSFER" &&
            !needsFinancialTransactionClassification(directTransaction)
          }
          canClassify={
            canFinanceWrite &&
            needsFinancialTransactionClassification(directTransaction)
          }
        />
      )}
    </div>
  )
}