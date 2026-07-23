import { Navigate, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useAuth } from "@/features/auth/hooks/use-auth"

export function NoOrganizationPage() {
  const navigate = useNavigate()
  const {
    session,
    isAuthenticated,
    logout,
  } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (
    (session?.user.organizations.length ?? 0) > 0
  ) {
    return (
      <Navigate
        to="/organizations"
        replace
      />
    )
  }

  function handleLogout() {
    logout()
    navigate("/login", { replace: true })
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Nenhuma organização disponível</CardTitle>
          <CardDescription>
            Seu usuário está autenticado, mas ainda não possui acesso ativo a
            uma organização.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Button variant="outline" onClick={handleLogout}>
            Sair
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}