import { useState } from "react"

import { PageHeader } from "@/components/layout/page-header"
import { PagePagination } from "@/components/pagination/page-pagination"
import { FinancialTransactionsTable } from "@/features/financial-transactions/components/financial-transactions-table"
import { useFinancialTransactions } from "@/features/financial-transactions/hooks/use-financial-transactions"
import { CreateFinancialTransactionDialog } from "@/features/financial-transactions/components/create-financial-transaction-dialog"
import { FinancialTransactionFilters } from "@/features/financial-transactions/components/financial-transaction-filters"
import { useAccounts } from "@/features/accounts/hooks/use-accounts"
import { useCategories } from "@/features/categories/hooks/use-categories"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImportOfxDialog } from "@/features/financial-transactions/components/import-ofx-dialog"
import { useSearchParams } from "react-router-dom"

export function TransactionsPage() {

  const [searchParams, setSearchParams] = useSearchParams()

  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [sort, setSort] = useState("settlementDate,desc")

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

  const { data, isLoading, isError } = useFinancialTransactions({
    page,
    size,
    sort,
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
    setSearchParams({})
  }

  return (
    <div>
      <PageHeader
        title="Transações"
        description="Acompanhe lançamentos financeiros, conciliações e movimentações oficiais."
      >
        <div className="flex gap-2">
          <ImportOfxDialog />
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

      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          {data?.totalElements ?? 0} transações encontradas
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="w-full sm:w-40">
            <Select
              value={String(size)}
              onValueChange={(value) => {
                setSize(Number(value))
                setPage(0)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Itens por página" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 por página</SelectItem>
                <SelectItem value="20">20 por página</SelectItem>
                <SelectItem value="50">50 por página</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-52">
            <Select
              value={sort}
              onValueChange={(value) => {
                setSort(value)
                setPage(0)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="settlementDate,desc">
                  Data mais recente
                </SelectItem>
                <SelectItem value="settlementDate,asc">
                  Data mais antiga
                </SelectItem>
                <SelectItem value="settledAmount,desc">
                  Maior valor baixado
                </SelectItem>
                <SelectItem value="settledAmount,asc">
                  Menor valor baixado
                </SelectItem>
                <SelectItem value="createdAt,desc">
                  Criação mais recente
                </SelectItem>
                <SelectItem value="createdAt,asc">
                  Criação mais antiga
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

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