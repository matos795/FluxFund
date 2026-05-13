import { Plus } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { AccountsTable } from "@/features/accounts/components/accounts-table"
import { accountsMock } from "@/features/accounts/accounts-mock"

export function AccountsPage() {
  return (
    <div>
      <PageHeader
        title="Contas"
        description="Gerencie contas bancárias, caixas físicos, carteiras e contas digitais."
      >
        <Button>
          <Plus className="mr-2 size-4" />
          Nova conta
        </Button>
      </PageHeader>

      <AccountsTable accounts={accountsMock} />
    </div>
  )
}