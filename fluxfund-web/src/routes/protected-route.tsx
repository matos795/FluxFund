import { Navigate, Outlet, useLocation } from "react-router-dom"

import { useAuth } from "@/features/auth/hooks/use-auth"

export function ProtectedRoute() {
  const location = useLocation()

  const {
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
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!activeOrganization) {
    return <Navigate to="/no-organization" replace />
  }

  return <Outlet />
}