import { useState } from "react"
import { Plus, Upload } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { PagePagination } from "@/components/pagination/page-pagination"
import { Button } from "@/components/ui/button"
import { FinancialTransactionsTable } from "@/features/financial-transactions/components/financial-transactions-table"
import { useFinancialTransactions } from "@/features/financial-transactions/hooks/use-financial-transactions"

const PAGE_SIZE = 10

export function TransactionsPage() {
  const [page, setPage] = useState(0)
  const size = PAGE_SIZE

  const { data, isLoading, isError } = useFinancialTransactions({
    page,
    size,
  })

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

          <Button>
            <Plus className="mr-2 size-4" />
            Nova transação
          </Button>
        </div>
      </PageHeader>

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