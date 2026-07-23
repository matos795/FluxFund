import { CreateOrganizationUserDialog } from "./create-organization-user-dialog"
import { OrganizationUsersTable } from "./organization-users-table"
import { useOrganizationUsers } from "../hooks/use-organization-users"
import { useOrganizationUserInvitations } from "@/features/organization-user-invitations/hooks/use-organization-user-invitations"
import { CreateOrganizationUserInvitationDialog } from "@/features/organization-user-invitations/components/create-organization-user-invitation-dialog"

export function OrganizationUsersSettingsCard() {
  const usersQuery = useOrganizationUsers()

  const invitationsQuery = useOrganizationUserInvitations()

  if (
    usersQuery.isLoading ||
    invitationsQuery.isLoading
  ) {
    return (
      <div className="rounded-lg border p-6 text-sm text-muted-foreground">
        Carregando usuários...
      </div>
    )
  }

  if (
    usersQuery.isError ||
    invitationsQuery.isError
  ) {
    return (
      <div className="rounded-lg border p-6 text-sm text-destructive">
        Não foi possível carregar os usuários da organização.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-end gap-2">
        <CreateOrganizationUserDialog />

        <CreateOrganizationUserInvitationDialog />
      </div>

      <div className="rounded-lg border bg-muted/30 p-4">
        <p className="font-medium">
          Convites
        </p>

        <p className="mt-1 text-sm text-muted-foreground">
          {invitationsQuery.data?.length ?? 0} convite(s)
          registrado(s). O link completo só é exibido no
          momento da criação.
        </p>
      </div>

      <OrganizationUsersTable
        users={usersQuery.data ?? []}
      />
    </div>
  )
}