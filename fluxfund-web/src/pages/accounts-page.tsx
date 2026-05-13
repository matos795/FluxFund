import { useState } from "react"

import { PageHeader } from "@/components/layout/page-header"
import { accountsMock } from "@/features/accounts/accounts-mock"
import type { AccountFormData } from "@/features/accounts/account-schema"
import { AccountsTable } from "@/features/accounts/components/accounts-table"
import { CreateAccountDialog } from "@/features/accounts/components/create-account-dialog"
import type { Account } from "@/features/accounts/types"

export function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>(accountsMock)

  function handleCreateAccount(data: AccountFormData) {
    const newAccount: Account = {
      id: crypto.randomUUID(),
      organizationId: "org-1",
      name: data.name,
      type: data.type,
      bankName: data.bankName || null,
      bankCode: data.bankCode || null,
      agency: data.agency || null,
      accountNumber: data.accountNumber || null,
      initialBalance: data.initialBalance,
      initialBalanceDate: data.initialBalanceDate,
      active: data.active,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setAccounts((currentAccounts) => [newAccount, ...currentAccounts])
  }

  return (
    <div>
      <PageHeader
        title="Contas"
        description="Gerencie contas bancárias, caixas físicos, carteiras e contas digitais."
      >
        <CreateAccountDialog onCreate={handleCreateAccount} />
      </PageHeader>

      <AccountsTable accounts={accounts} />
    </div>
  )
}