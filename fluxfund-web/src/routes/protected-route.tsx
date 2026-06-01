import { Navigate, Outlet, useLocation } from "react-router-dom"

import { useAuth } from "@/features/auth/hooks/use-auth"

export function ProtectedRoute() {
  const location = useLocation()
  const { isAuthenticated, activeOrganization } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!activeOrganization) {
    return <Navigate to="/no-organization" replace />
  }

  return <Outlet />
}