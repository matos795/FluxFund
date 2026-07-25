import {
  Building2,
  LogOut,
  Mail as MailClock,
  Search,
  ShieldCheck,
  UserCheck,
} from "lucide-react"
import {
  useState,
  type FormEvent,
} from "react"
import {
  Link,
  useNavigate,
} from "react-router-dom"

import { PagePagination } from "@/components/pagination/page-pagination"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { CreatePlatformOrganizationDialog } from "@/features/platform-organizations/components/create-platform-organization-dialog"
import { usePlatformOrganizations } from "@/features/platform-organizations/hooks/use-platform-organizations"

const PAGE_SIZE = 20

function formatDateTime(
  value: string,
) {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle: "short",
      timeStyle: "short",
    },
  ).format(
    new Date(value),
  )
}

function formatCnpj(
  value: string | null,
) {
  if (!value) {
    return "Não informado"
  }

  return value.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5",
  )
}

export function PlatformOrganizationsPage() {
  const navigate = useNavigate()

  const {
    session,
    logout,
  } = useAuth()

  const [page, setPage] =
    useState(0)

  const [
    searchInput,
    setSearchInput,
  ] = useState("")

  const [
    appliedQuery,
    setAppliedQuery,
  ] = useState("")

  const organizationsQuery =
    usePlatformOrganizations({
      page,
      size: PAGE_SIZE,

      query:
        appliedQuery ||
        undefined,
    })

  const data =
    organizationsQuery.data

  const organizations =
    data?.content ?? []

  const activeOrganizationsOnPage =
    organizations.filter(
      (organization) =>
        organization.active,
    ).length

  const activeUsersOnPage =
    organizations.reduce(
      (total, organization) =>
        total +
        organization.activeUsers,

      0,
    )

  const pendingInvitationsOnPage =
    organizations.reduce(
      (total, organization) =>
        total +
        organization
          .pendingInvitations,

      0,
    )

  function handleSearch(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setPage(0)

    setAppliedQuery(
      searchInput.trim(),
    )
  }

  function handleClearSearch() {
    setSearchInput("")
    setAppliedQuery("")
    setPage(0)
  }

  function handleLogout() {
    logout()

    navigate(
      "/login",
      {
        replace: true,
      },
    )
  }

  return (
    <main className="min-h-screen bg-muted/40">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <ShieldCheck className="size-5" />
            </div>

            <div>
              <p className="font-semibold">
                FluxFund
              </p>

              <p className="text-sm text-muted-foreground">
                Administração da plataforma
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(session
              ?.user
              .organizations
              .length ?? 0) > 0 && (
              <Button
                variant="outline"
                asChild
              >
                <Link to="/organizations">
                  <Building2 className="mr-2 size-4" />
                  Minhas organizações
                </Link>
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={
                handleLogout
              }
            >
              <LogOut className="mr-2 size-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Badge variant="outline">
              Backoffice
            </Badge>

            <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
              Clientes do FluxFund
            </h1>

            <p className="mt-2 max-w-2xl text-muted-foreground">
              Cadastre organizações, acompanhe
              usuários e controle os convites de
              implantação.
            </p>

            <p className="mt-2 text-sm text-muted-foreground">
              Conectado como{" "}
              <strong className="text-foreground">
                {session?.user.name}
              </strong>
            </p>
          </div>

          <CreatePlatformOrganizationDialog />
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Organizações encontradas
              </CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-3xl font-semibold">
                {
                  data
                    ?.totalElements ??
                  0
                }
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ativas nesta página
              </CardTitle>
            </CardHeader>

            <CardContent className="flex items-center gap-3">
              <Building2 className="size-5 text-muted-foreground" />

              <p className="text-3xl font-semibold">
                {
                  activeOrganizationsOnPage
                }
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Usuários ativos nesta página
              </CardTitle>
            </CardHeader>

            <CardContent className="flex items-center gap-3">
              <UserCheck className="size-5 text-muted-foreground" />

              <p className="text-3xl font-semibold">
                {
                  activeUsersOnPage
                }
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Convites pendentes nesta página
              </CardTitle>
            </CardHeader>

            <CardContent className="flex items-center gap-3">
              <MailClock className="size-5 text-muted-foreground" />

              <p className="text-3xl font-semibold">
                {
                  pendingInvitationsOnPage
                }
              </p>
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>
              Pesquisar clientes
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form
              className="flex flex-col gap-3 sm:flex-row"
              onSubmit={
                handleSearch
              }
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  value={
                    searchInput
                  }
                  onChange={(event) =>
                    setSearchInput(
                      event.target.value,
                    )
                  }
                  className="pl-9"
                  placeholder="Pesquisar pelo nome da organização"
                />
              </div>

              <Button type="submit">
                Pesquisar
              </Button>

              {(searchInput ||
                appliedQuery) && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={
                    handleClearSearch
                  }
                >
                  Limpar
                </Button>
              )}
            </form>
          </CardContent>
        </Card>

        {organizationsQuery.isFetching &&
          !organizationsQuery.isLoading && (
            <p className="text-xs text-muted-foreground">
              Atualizando organizações...
            </p>
          )}

        {organizationsQuery.isError && (
          <p className="text-sm text-destructive">
            Não foi possível carregar os clientes.
          </p>
        )}

        <Card>
          <CardHeader>
            <CardTitle>
              Organizações cadastradas
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {organizationsQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">
                Carregando organizações...
              </p>
            ) : organizations.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <Building2 className="mx-auto size-8 text-muted-foreground" />

                <p className="mt-3 font-medium">
                  Nenhuma organização encontrada
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Cadastre o primeiro cliente ou
                  altere os termos da pesquisa.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        Organização
                      </TableHead>

                      <TableHead>
                        Status
                      </TableHead>

                      <TableHead>
                        CNPJ
                      </TableHead>

                      <TableHead>
                        Usuários
                      </TableHead>

                      <TableHead>
                        Convites
                      </TableHead>

                      <TableHead>
                        Criada em
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {organizations.map(
                      (
                        organization,
                      ) => (
                        <TableRow
                          key={
                            organization.id
                          }
                          className={
                            organization.active
                              ? undefined
                              : "bg-muted/30"
                          }
                        >
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {
                                  organization.name
                                }
                              </p>

                              <p className="text-xs text-muted-foreground">
                                {
                                  organization.contactEmail ??
                                  "E-mail não informado"
                                }
                              </p>
                            </div>
                          </TableCell>

                          <TableCell>
                            <Badge
                              variant={
                                organization.active
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {organization.active
                                ? "Ativa"
                                : "Suspensa"}
                            </Badge>
                          </TableCell>

                          <TableCell className="whitespace-nowrap text-sm">
                            {formatCnpj(
                              organization.cnpj,
                            )}
                          </TableCell>

                          <TableCell>
                            <p className="text-sm font-medium">
                              {
                                organization.activeUsers
                              }{" "}
                              ativo(s)
                            </p>

                            <p className="text-xs text-muted-foreground">
                              {
                                organization.totalUsers
                              }{" "}
                              vínculo(s)
                            </p>
                          </TableCell>

                          <TableCell>
                            {organization.pendingInvitations >
                            0 ? (
                              <Badge variant="outline">
                                {
                                  organization.pendingInvitations
                                }{" "}
                                pendente(s)
                              </Badge>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                Nenhum
                              </span>
                            )}
                          </TableCell>

                          <TableCell className="whitespace-nowrap text-sm">
                            {formatDateTime(
                              organization.createdAt,
                            )}
                          </TableCell>
                        </TableRow>
                      ),
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            {data && (
              <PagePagination
                page={data.number}
                totalPages={
                  data.totalPages
                }
                totalElements={
                  data.totalElements
                }
                size={data.size}
                isFirst={data.first}
                isLast={data.last}
                onPageChange={
                  setPage
                }
              />
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}