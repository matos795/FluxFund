import { useState } from "react"
import { Upload } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { PagePagination } from "@/components/pagination/page-pagination"
import { Button } from "@/components/ui/button"
import { FinancialTransactionsTable } from "@/features/financial-transactions/components/financial-transactions-table"
import { useFinancialTransactions } from "@/features/financial-transactions/hooks/use-financial-transactions"
import { CreateFinancialTransactionDialog } from "@/features/financial-transactions/components/create-financial-transaction-dialog"
import { FinancialTransactionFilters } from "@/features/financial-transactions/components/financial-transaction-filters"
import { useAccounts } from "@/features/accounts/hooks/use-accounts"
import { useCategories } from "@/features/categories/hooks/use-categories"

export function TransactionsPage() {
  const [page, setPage] = useState(0)
  const [size] = useState(10)

  const [type, setType] = useState("")
  const [status, setStatus] = useState("")
  const [accountId, setAccountId] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [description, setDescription] = useState("")
  const [settlementDateFrom, setSettlementDateFrom] = useState("")
  const [settlementDateTo, setSettlementDateTo] = useState("")
  const [source, setSource] = useState("")
  const [onlyUnclassified, setOnlyUnclassified] = useState(false)
  const [onlyUnallocated, setOnlyUnallocated] = useState(false)

  const { data, isLoading, isError } = useFinancialTransactions({
    page,
    size,
    type,
    status,
    source,
    accountId,
    categoryId,
    description,
    settlementDateFrom,
    settlementDateTo,
    onlyUnclassified,
    onlyUnallocated,
  })

  const { data: accountsData } = useAccounts({
    page: 0,
    size: 100,
  })

  const { data: categoriesData } = useCategories({
    page: 0,
    size: 100,
  })

  const accounts = accountsData?.content ?? []
  const categories = categoriesData?.content ?? []

  function handleClearFilters() {
    setType("")
    setStatus("")
    setSource("")
    setAccountId("")
    setCategoryId("")
    setDescription("")
    setSettlementDateFrom("")
    setSettlementDateTo("")
    setOnlyUnclassified(false)
    setOnlyUnallocated(false)
    setPage(0)
  }

  return (
    <div>
      <PageHeader
        title="Transações"
        description="Acompanhe lançamentos financeiros, conciliações e movimentações oficiais."
      >
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="mr-2 size-4" />
            Importar OFX
          </Button>

          <CreateFinancialTransactionDialog />
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
        accounts={accounts}
        categories={categories}
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
          setPage(0)
        }}
        onOnlyUnallocatedChange={(value) => {
          setOnlyUnallocated(value)
          setPage(0)
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

      {data && (
        <>
          <FinancialTransactionsTable financialTransactions={data.content} />

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
    </div>
  )
}