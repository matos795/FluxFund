import type { OrganizationRole } from "@/features/auth/auth-types"

export const organizationRoleLabels: Record<OrganizationRole, string> = {
  OWNER: "Proprietário",
  ADMIN: "Administrador",
  FINANCE: "Financeiro",
  VIEWER: "Visualização",
}