import { useAuth } from "./use-auth"

export function usePermissions() {
  const { activeOrganization } = useAuth()

  const role = activeOrganization?.role

  const canRead = Boolean(role)

  const canFinanceWrite =
    role === "OWNER" ||
    role === "ADMIN" ||
    role === "FINANCE"

  const canAdmin =
    role === "OWNER" ||
    role === "ADMIN"

  const isViewer = role === "VIEWER"

  return {
    role,
    canRead,
    canFinanceWrite,
    canAdmin,
    isViewer,
  }
}