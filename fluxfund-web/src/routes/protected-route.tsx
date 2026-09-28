import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom"

import { useAuth } from "@/features/auth/hooks/use-auth"
import { useLegalStatus } from "@/features/legal/hooks/use-legal-status"
import { Button } from "@/components/ui/button"

type ProtectedRouteProps = {
  requireOrganization?: boolean
  requireLegalAcceptance?: boolean
}

export function ProtectedRoute({
  requireOrganization = true,
  requireLegalAcceptance = true,
}: ProtectedRouteProps) {
  const location = useLocation()

  const {
    session,
    isAuthenticated,
    isLoadingSession,
    activeOrganization,
  } = useAuth()

  const legalStatusQuery = useLegalStatus(isAuthenticated && requireLegalAcceptance,)

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
    requireLegalAcceptance &&
    legalStatusQuery.isPending
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/40">
        <p className="text-sm text-muted-foreground">
          Verificando os termos de acesso...
        </p>
      </main>
    )
  }

  if (
    requireLegalAcceptance &&
    legalStatusQuery.isError
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
        <div className="space-y-4 text-center">
          <div>
            <h1 className="font-semibold">
              Não foi possível verificar seu acesso
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Tente novamente antes de continuar.
            </p>
          </div>

          <Button
            onClick={() =>
              legalStatusQuery.refetch()
            }
          >
            Tentar novamente
          </Button>
        </div>
      </main>
    )
  }

  if (
    requireLegalAcceptance &&
    legalStatusQuery.data
      ?.enforcementEnabled &&
    legalStatusQuery.data
      .acceptanceRequired &&
    location.pathname !==
    "/legal/acceptance"
  ) {
    return (
      <Navigate
        to="/legal/acceptance"
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