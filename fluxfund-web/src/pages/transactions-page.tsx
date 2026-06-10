import { useEffect, useMemo, useState } from "react"

import { PageHeader } from "@/components/layout/page-header"
import { PagePagination } from "@/components/pagination/page-pagination"
import { FinancialTransactionsTable } from "@/features/financial-transactions/components/financial-transactions-table"
import { useFinancialTransactions } from "@/features/financial-transactions/hooks/use-financial-transactions"
import { CreateFinancialTransactionDialog } from "@/features/financial-transactions/components/create-financial-transaction-dialog"
import { FinancialTransactionFilters } from "@/features/financial-transactions/components/financial-transaction-filters"
import { ImportOfxDialog } from "@/features/financial-transactions/components/import-ofx-dialog"
import { useSearchParams } from "react-router-dom"
import { ExportSettledFinancialTransactionsDialog } from "@/features/financial-transactions/components/export-settled-financial-transactions-dialog"
import { usePermissions } from "@/features/auth/hooks/use-permissions"
import { useCategoryOptions } from "@/features/categories/hooks/use-category-options"
import { useAccountOptions } from "@/features/accounts/hooks/use-account-options"
import { useFinancialTransaction } from "@/features/financial-transactions/hooks/use-financial-transaction"
import { ViewFinancialTransactionDialog } from "@/features/financial-transactions/components/view-financial-transaction-dialog"
import { ClassifyFinancialTransactionDialog } from "@/features/financial-transactions/components/classify-financial-transaction-dialog"
import { ManageTransactionAllocationsDialog } from "@/features/financial-transactions/components/manage-transaction-allocations-dialog"
import { FinancialTransactionAttachmentsDialog } from "@/features/attachments/components/financial-transaction-attachments-dialog"

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

  const directDialogKey = useMemo(() => {
    if (!actionTransactionId) {
      return null
    }

    return `${actionTransactionId}:${resolvedAction}`
  }, [actionTransactionId, resolvedAction])

  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [sort, setSort] = useState("settlementDate,desc")
  const [fundId, setFundId] = useState(searchParams.get("fundId") ?? "")

  const [type, setType] = useState(searchParams.get("type") ?? "")
  const [status, setStatus] = useState(searchParams.get("status") ?? "")
  const [accountId, setAccountId] = useState(searchParams.get("accountId") ?? "")
  const [categoryId, setCategoryId] = useState(searchParams.get("categoryId") ?? "")
  const [description, setDescription] = useState(searchParams.get("description") ?? "")
  const [settlementDateFrom, setSettlementDateFrom] = useState(
    searchParams.get("settlementDateFrom") ?? "",
  )
  const [settlementDateTo, setSettlementDateTo] = useState(
    searchParams.get("settlementDateTo") ?? "",
  )
  const [source, setSource] = useState(searchParams.get("source") ?? "")
  const [onlyUnclassified, setOnlyUnclassified] = useState(
    searchParams.get("onlyUnclassified") === "true",
  )
  const [onlyUnallocated, setOnlyUnallocated] = useState(
    searchParams.get("onlyUnallocated") === "true",
  )

  const [directDialogOpen, setDirectDialogOpen] = useState(false)
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
      setDirectDialogOpen(true)
      setOpenedDirectDialogKey(directDialogKey)
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [directTransaction, directDialogKey, openedDirectDialogKey])

  function handleClearFilters() {
    setType("")
    setStatus("")
    setSource("")
    setAccountId("")
    setCategoryId("")
    setFundId("")
    setDescription("")
    setSettlementDateFrom("")
    setSettlementDateTo("")
    setOnlyUnclassified(false)
    setOnlyUnallocated(false)
    setPage(0)
    setSearchParams({})
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
              <ImportOfxDialog />
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
        settlementDateFrom={settlementDateFrom}
        settlementDateTo={settlementDateTo}
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
          setPage(0)
        }}
        onStatusChange={(value) => {
          setStatus(value)
          setPage(0)
        }}
        onSourceChange={(value) => {
          setSource(value)
          setPage(0)
        }}
        onAccountIdChange={(value) => {
          setAccountId(value)
          setPage(0)
        }}
        onCategoryIdChange={(value) => {
          setCategoryId(value)
          setPage(0)
        }}
        onDescriptionChange={(value) => {
          setDescription(value)
          setPage(0)
        }}
        onSettlementDateFromChange={(value) => {
          setSettlementDateFrom(value)
          setPage(0)
        }}
        onSettlementDateToChange={(value) => {
          setSettlementDateTo(value)
          setPage(0)
        }}
        onOnlyUnclassifiedChange={(value) => {
          setOnlyUnclassified(value)
          setOnlyUnallocated(false)
          setPage(0)

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
          setPage(0)

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

      {data && (
        <>
          <FinancialTransactionsTable
            financialTransactions={data.content}
            totalElements={data.totalElements}
            size={size}
            sort={sort}
            onSizeChange={(value) => {
              setSize(value)
              setPage(0)
            }}
            onSortChange={(value) => {
              setSort(value)
              setPage(0)
            }}
          />

          <PagePagination
            page={data.number}
            totalPages={data.totalPages}
            totalElements={data.totalElements}
            size={data.size}
            isFirst={data.first}
            isLast={data.last}
            onPageChange={setPage}
          />
        </>
      )}

      {directTransaction && resolvedAction === "view" && (
        <ViewFinancialTransactionDialog
          transaction={directTransaction}
          open={directDialogOpen}
          onOpenChange={handleDirectDialogOpenChange}
          trigger={null}
        />
      )}

      {directTransaction && resolvedAction === "classify" && (
        <ClassifyFinancialTransactionDialog
          transaction={directTransaction}
          open={directDialogOpen}
          onOpenChange={handleDirectDialogOpenChange}
          trigger={null}
        />
      )}

      {directTransaction && resolvedAction === "allocate" && (
        <ManageTransactionAllocationsDialog
          transaction={directTransaction}
          open={directDialogOpen}
          onOpenChange={handleDirectDialogOpenChange}
          trigger={null}
        />
      )}

      {directTransaction && resolvedAction === "attachments" && (
        <FinancialTransactionAttachmentsDialog
          transaction={directTransaction}
          open={directDialogOpen}
          onOpenChange={handleDirectDialogOpenChange}
          trigger={null}
        />
      )}
    </div>
  )
}