import type { OrganizationUserInvitationStatus } from "./organization-user-invitation-types"

export const invitationStatusLabels: Record<
  OrganizationUserInvitationStatus,
  string
> = {
  PENDING: "Pendente",
  EXPIRED: "Expirado",
  ACCEPTED: "Aceito",
  CANCELED: "Cancelado",
}

export const invitationStatusClassNames: Record<
  OrganizationUserInvitationStatus,
  string
> = {
  PENDING:
    "border-amber-300 bg-amber-50 text-amber-800",

  EXPIRED:
    "border-orange-300 bg-orange-50 text-orange-800",

  ACCEPTED:
    "border-emerald-300 bg-emerald-50 text-emerald-800",

  CANCELED:
    "border-muted bg-muted text-muted-foreground",
}