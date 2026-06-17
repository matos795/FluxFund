import { PageHeader } from "@/components/layout/page-header"
import { PagePagination } from "@/components/pagination/page-pagination"
import { AccountsTable } from "@/features/accounts/components/accounts-table"
import { AccountsTableSkeleton } from "@/features/accounts/components/accounts-table-skeleton"
import { CreateAccountDialog } from "@/features/accounts/components/create-account-dialog"
import { useAccounts } from "@/features/accounts/hooks/use-accounts"
import { usePermissions } from "@/features/auth/hooks/use-permissions"
import { useState } from "react"

const PAGE_SIZE = 10

export function AccountsPage() {

  const { canManageAccounts } = usePermissions()

  const [page, setPage] = useState(0)

  const { data, isLoading, isError, isFetching } = useAccounts({
    page,
    size: PAGE_SIZE,
  })

  const accounts = data?.content ?? []

  return (
    <div>
      <PageHeader
        title="Contas"
        description="Gerencie contas bancárias, caixas físicos, carteiras e contas digitais."
      >
        {canManageAccounts && <CreateAccountDialog />}
      </PageHeader>

      {isLoading && <AccountsTableSkeleton />}

      {isFetching && !isLoading && (
        <p className="mb-3 text-xs text-muted-foreground">
          Atualizando dados...
        </p>
      )}

      {isError && (
        <p className="text-sm text-destructive">
          Não foi possível carregar as contas.
        </p>
      )}

      {!isLoading && !isError && (
        <div className="space-y-4">
          <AccountsTable accounts={accounts} />

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
        </div>
      )}
    </div>
  )
}