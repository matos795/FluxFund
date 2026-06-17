import { PageHeader } from "@/components/layout/page-header"
import { PagePagination } from "@/components/pagination/page-pagination"
import { usePermissions } from "@/features/auth/hooks/use-permissions"
import { CreateFundDialog } from "@/features/funds/components/create-fund-dialog"
import { CreateFundTransferDialog } from "@/features/funds/components/create-fund-transfer-dialog"
import { FundTransfersTable } from "@/features/funds/components/fund-transfers-table"
import { FundsTable } from "@/features/funds/components/funds-table"
import { FundsTableSkeleton } from "@/features/funds/components/funds-table-skeleton"
import { useFundTransfers } from "@/features/funds/hooks/use-fund-transfers"
import { useFunds } from "@/features/funds/hooks/use-funds"
import { useState } from "react"

const PAGE_SIZE = 10
const TRANSFER_PAGE_SIZE = 5

export function FundsPage() {

  const { canFinanceWrite } = usePermissions()

  const [page, setPage] = useState(0)
  const [transferPage, setTransferPage] = useState(0)


  const { data, isLoading, isError, isFetching } = useFunds({
    page,
    size: PAGE_SIZE,
  })

  const {
    data: transfersData,
    isLoading: isTransfersLoading,
    isError: isTransfersError,
    isFetching: isTransfersFetching,
  } = useFundTransfers({
    page: transferPage,
    size: TRANSFER_PAGE_SIZE,
  })

  const transfers = transfersData?.content ?? []

  const funds = data?.content ?? []

  return (
    <div>
      <PageHeader
        title="Fundos"
        description="Gerencie fundos, projetos e destinações internas de recursos."
      >
        {canFinanceWrite && (
          <>
            <CreateFundTransferDialog />
            <CreateFundDialog />
          </>
        )}
      </PageHeader>

      {isLoading && <FundsTableSkeleton />}

      {isFetching && !isLoading && (
        <p className="mb-3 text-xs text-muted-foreground">
          Atualizando dados...
        </p>
      )}

      {isError && (
        <p className="text-sm text-destructive">
          Não foi possível carregar os fundos.
        </p>
      )}

      {!isLoading && !isError && (
        <div className="space-y-4">
          <FundsTable funds={funds} />

          {data && (
            <PagePagination
              page={data.number}
              totalPages={data.totalPages}
              totalElements={data.totalElements}
              size={data.size}
              isFirst={data.first}
              isLast={data.last}
              onPageChange={setPage}
            />
          )}

          <div className="space-y-3">
            {isTransfersFetching && !isTransfersLoading && (
              <p className="text-xs text-muted-foreground">
                Atualizando transferências...
              </p>
            )}

            {isTransfersError && (
              <p className="text-sm text-destructive">
                Não foi possível carregar as transferências entre fundos.
              </p>
            )}

            {!isTransfersLoading && !isTransfersError && (
              <>
                <FundTransfersTable
                  transfers={transfers}
                  canFinanceWrite={canFinanceWrite}
                />

                {transfersData && (
                  <PagePagination
                    page={transfersData.number}
                    totalPages={transfersData.totalPages}
                    totalElements={transfersData.totalElements}
                    size={transfersData.size}
                    isFirst={transfersData.first}
                    isLast={transfersData.last}
                    onPageChange={setTransferPage}
                  />
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}