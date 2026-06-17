import { CreateOrganizationUserDialog } from "./create-organization-user-dialog"
import { OrganizationUsersTable } from "./organization-users-table"
import { useOrganizationUsers } from "../hooks/use-organization-users"

export function OrganizationUsersSettingsCard() {
  const usersQuery = useOrganizationUsers()

  if (usersQuery.isLoading) {
    return (
      <div className="rounded-lg border p-6 text-sm text-muted-foreground">
        Carregando usuários...
      </div>
    )
  }

  if (usersQuery.isError) {
    return (
      <div className="rounded-lg border p-6 text-sm text-destructive">
        Não foi possível carregar os usuários da organização.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <CreateOrganizationUserDialog />
      </div>

      <OrganizationUsersTable users={usersQuery.data ?? []} />
    </div>
  )
}