import {
  ArrowRight,
  Building2,
  CheckCircle2,
  LogOut,
} from "lucide-react"
import { useState } from "react"
import {
  Navigate,
  useNavigate,
} from "react-router-dom"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { organizationRoleLabels } from "@/features/organization-users/organization-user-labels"
import { cn } from "@/lib/utils"

export function OrganizationsPage() {
  const navigate = useNavigate()

  const {
    session,
    activeOrganization,
    setActiveOrganization,
    logout,
  } = useAuth()

  const [selectingOrganizationId, setSelectingOrganizationId] =
    useState<string | null>(null)

  const organizations =
    session?.user.organizations ?? []

  if (organizations.length === 0) {
    return (
      <Navigate
        to="/no-organization"
        replace
      />
    )
  }

  async function handleSelectOrganization(
    organizationId: string,
  ) {
    setSelectingOrganizationId(organizationId)

    await setActiveOrganization(
      organizationId,
    )

    navigate("/", {
      replace: true,
    })
  }

  function handleLogout() {
    logout()

    navigate("/login", {
      replace: true,
    })
  }

  return (
    <main className="min-h-screen bg-muted/40 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Building2 className="size-5" />
            </div>

            <div>
              <p className="font-semibold">
                FluxFund
              </p>

              <p className="text-sm text-muted-foreground">
                Gestão financeira por organização
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 size-4" />
            Sair
          </Button>
        </header>

        <section className="rounded-3xl border bg-background p-6 shadow-sm sm:p-8">
          <div className="max-w-2xl">
            <Badge variant="outline">
              Minhas organizações
            </Badge>

            <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
              Onde você deseja entrar?
            </h1>

            <p className="mt-2 text-muted-foreground">
              Escolha a organização que deseja
              administrar. Todos os dados, relatórios e
              configurações serão carregados para ela.
            </p>

            <p className="mt-3 text-sm text-muted-foreground">
              Conectado como{" "}
              <strong className="text-foreground">
                {session?.user.name}
              </strong>{" "}
              · {session?.user.email}
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {organizations.map(
              (organization) => {
                const isCurrent =
                  activeOrganization?.id ===
                  organization.id

                const isSelecting =
                  selectingOrganizationId ===
                  organization.id

                return (
                  <button
                    key={organization.id}
                    type="button"
                    disabled={
                      selectingOrganizationId !== null
                    }
                    onClick={() =>
                      handleSelectOrganization(
                        organization.id,
                      )
                    }
                    className="text-left disabled:cursor-wait disabled:opacity-70"
                  >
                    <Card
                      className={cn(
                        "h-full transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md",
                        isCurrent &&
                          "border-primary/40 bg-primary/[0.03]",
                      )}
                    >
                      <CardContent className="flex h-full items-center gap-4 p-5">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-lg font-bold text-primary">
                          {organization.name
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate font-semibold">
                              {organization.name}
                            </p>

                            {isCurrent && (
                              <Badge
                                variant="secondary"
                                className="gap-1"
                              >
                                <CheckCircle2 className="size-3" />
                                Atual
                              </Badge>
                            )}
                          </div>

                          <p className="mt-1 text-sm text-muted-foreground">
                            {
                              organizationRoleLabels[
                                organization.role
                              ]
                            }
                          </p>
                        </div>

                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full border bg-background">
                          {isSelecting ? (
                            <span className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          ) : (
                            <ArrowRight className="size-4" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </button>
                )
              },
            )}
          </div>
        </section>
      </div>
    </main>
  )
}