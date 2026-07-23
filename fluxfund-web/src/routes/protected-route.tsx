import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom"

import { useAuth } from "@/features/auth/hooks/use-auth"

type ProtectedRouteProps = {
  requireOrganization?: boolean
}

export function ProtectedRoute({
  requireOrganization = true,
}: ProtectedRouteProps) {
  const location = useLocation()

  const {
    session,
    isAuthenticated,
    isLoadingSession,
    activeOrganization,
  } = useAuth()

  if (isLoadingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/40">
        <p className="text-sm text-muted-foreground">
          Carregando sua sessão...
        </p>
      </main>
    )
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    )
  }

  if (
    requireOrganization &&
    !activeOrganization
  ) {
    const hasOrganizations =
      (session?.user.organizations.length ?? 0) > 0

    return (
      <Navigate
        to={
          hasOrganizations
            ? "/organizations"
            : "/no-organization"
        }
        replace
      />
    )
  }

  return <Outlet />
}