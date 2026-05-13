import { PageHeader } from "@/components/layout/page-header"
import { AccountsTable } from "@/features/accounts/components/accounts-table"
import { CreateAccountDialog } from "@/features/accounts/components/create-account-dialog"
import { useAccounts } from "@/features/accounts/hooks/use-accounts"

export function AccountsPage() {
  const { data, isLoading, isError } = useAccounts()

  const accounts = data?.content ?? []

  return (
    <div>
      <PageHeader
        title="Contas"
        description="Gerencie contas bancárias, caixas físicos, carteiras e contas digitais."
      >
        <CreateAccountDialog onCreate={(data) => console.log(data)} />
      </PageHeader>

      {isLoading && (
        <p className="text-sm text-muted-foreground">
          Carregando contas...
        </p>
      )}

      {isError && (
        <p className="text-sm text-destructive">
          Não foi possível carregar as contas.
        </p>
      )}

      {!isLoading && !isError && <AccountsTable accounts={accounts} />}
    </div>
  )
}