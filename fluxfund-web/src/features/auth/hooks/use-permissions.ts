import { useAuth } from "./use-auth"

export function usePermissions() {
  const {
    activeOrganization,
    session,
  } = useAuth()

  const isPlatformAdmin = session?.user.platformAdmin === true

  const role = activeOrganization?.role

  const isOwner = role === "OWNER"
  const isAdmin = role === "ADMIN"
  const isFinance = role === "FINANCE"
  const isViewer = role === "VIEWER"

  const canRead = Boolean(role)

  const canFinanceWrite = isOwner || isAdmin || isFinance

  const canAdmin = isOwner || isAdmin

  const canManageOrganization = canAdmin

  const canManageUsers = canAdmin

  const canManageOwners = isOwner

  const canManageAccounts = canAdmin

  const canManageFinancialSettings = canAdmin

  const canExportReports = canRead

  return {
    role,

    isPlatformAdmin,

    isOwner,
    isAdmin,
    isFinance,
    isViewer,

    canRead,
    canFinanceWrite,
    canAdmin,

    canManageOrganization,
    canManageUsers,
    canManageOwners,
    canManageAccounts,
    canManageFinancialSettings,
    canExportReports,
  }
}