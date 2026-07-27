import {
  Building2,
  Eye,
  Mail,
  PauseCircle,
  PlayCircle,
  UserRound,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import {
  AppDialogBody,
  AppDialogContent,
  AppDialogFooter,
  AppDialogHeader,
  AppDialogSection,
  AppDialogStatCard,
} from "@/components/layout/app-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  invitationStatusClassNames,
  invitationStatusLabels,
} from "@/features/organization-user-invitations/organization-user-invitation-labels"
import { organizationRoleLabels } from "@/features/organization-users/organization-user-labels"
import { getApiErrorMessage } from "@/utils/api-error"

import { usePlatformOrganizationDetails } from "../hooks/use-platform-organization-details"
import { useUpdatePlatformOrganizationStatus } from "../hooks/use-update-platform-organization-status"
import type { PlatformOrganization } from "../platform-organization-types"

type PlatformOrganizationDetailsDialogProps = {
  organization: PlatformOrganization
}

function formatDateTime(
  value: string,
) {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle: "short",
      timeStyle: "short",
    },
  ).format(new Date(value))
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

export function PlatformOrganizationDetailsDialog({
  organization,
}: PlatformOrganizationDetailsDialogProps) {
  const [open, setOpen] =
    useState(false)

  const [
    requestedStatus,
    setRequestedStatus,
  ] = useState<boolean | null>(
    null,
  )

  const detailsQuery =
    usePlatformOrganizationDetails(
      organization.id,
      open,
    )

  const updateStatusMutation =
    useUpdatePlatformOrganizationStatus()

  const details =
    detailsQuery.data

  const currentOrganization =
    details?.organization ??
    organization

  const users =
    details?.users ?? []

  const invitations =
    details?.invitations ?? []

  function handleUpdateStatus() {
    if (requestedStatus === null) {
      return
    }

    updateStatusMutation.mutate(
      {
        organizationId:
          organization.id,

        data: {
          active: requestedStatus,
        },
      },

      {
        onSuccess: () => {
          toast.success(
            requestedStatus
              ? "Organização reativada."
              : "Organização suspensa.",
          )

          setRequestedStatus(null)
        },

        onError: (error) => {
          toast.error(
            getApiErrorMessage(
              error,
              "Não foi possível alterar o status da organização.",
            ),
          )
        },
      },
    )
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={setOpen}
      >
        <DialogTrigger asChild>
          <Button
            type="button"
            size="sm"
            variant="outline"
          >
            <Eye className="mr-2 size-4" />
            Gerenciar
          </Button>
        </DialogTrigger>

        <AppDialogContent size="full">
          <AppDialogHeader
            icon={
              <Building2 className="size-4 text-muted-foreground" />
            }
            title={
              currentOrganization.name
            }
            description="Informações do cliente, usuários vinculados e convites de acesso."
            aside={
              <Badge
                variant={
                  currentOrganization.active
                    ? "default"
                    : "secondary"
                }
              >
                {currentOrganization.active
                  ? "Ativa"
                  : "Suspensa"}
              </Badge>
            }
          />

          <AppDialogBody className="space-y-5">
            {detailsQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">
                Carregando dados da organização...
              </p>
            ) : detailsQuery.isError ? (
              <p className="text-sm text-destructive">
                Não foi possível carregar os detalhes.
              </p>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <AppDialogStatCard
                    label="Usuários ativos"
                    value={
                      currentOrganization.activeUsers
                    }
                    description={`${currentOrganization.totalUsers} vínculo(s) no total`}
                  />

                  <AppDialogStatCard
                    label="Convites pendentes"
                    value={
                      currentOrganization.pendingInvitations
                    }
                  />

                  <AppDialogStatCard
                    label="CNPJ"
                    value={formatCnpj(
                      currentOrganization.cnpj,
                    )}
                  />

                  <AppDialogStatCard
                    label="Criada em"
                    value={formatDateTime(
                      currentOrganization.createdAt,
                    )}
                  />
                </div>

                <AppDialogSection
                  title="Contato"
                  description="Informações atualmente cadastradas no perfil da organização."
                >
                  <div className="grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        E-mail
                      </p>

                      <p className="mt-1 font-medium">
                        {currentOrganization.contactEmail ??
                          "Não informado"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Status de acesso
                      </p>

                      <p className="mt-1 font-medium">
                        {currentOrganization.active
                          ? "Acesso liberado"
                          : "Acesso bloqueado"}
                      </p>
                    </div>
                  </div>
                </AppDialogSection>

                <AppDialogSection
                  title="Usuários"
                  description="Pessoas que possuem ou já possuíram vínculo com esta organização."
                  action={
                    <UserRound className="size-4 text-muted-foreground" />
                  }
                >
                  {users.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Nenhum usuário vinculado. O primeiro proprietário ainda pode não ter aceitado o convite.
                    </p>
                  ) : (
                    <div className="overflow-x-auto rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>
                              Usuário
                            </TableHead>

                            <TableHead>
                              Papel
                            </TableHead>

                            <TableHead>
                              Status
                            </TableHead>

                            <TableHead>
                              Vínculo criado
                            </TableHead>
                          </TableRow>
                        </TableHeader>

                        <TableBody>
                          {users.map(
                            (user) => (
                              <TableRow
                                key={
                                  user.userId
                                }
                              >
                                <TableCell>
                                  <p className="font-medium">
                                    {user.name}
                                  </p>

                                  <p className="text-xs text-muted-foreground">
                                    {user.email}
                                  </p>
                                </TableCell>

                                <TableCell>
                                  {
                                    organizationRoleLabels[
                                      user.role
                                    ]
                                  }
                                </TableCell>

                                <TableCell>
                                  <Badge
                                    variant={
                                      user.active
                                        ? "default"
                                        : "secondary"
                                    }
                                  >
                                    {user.active
                                      ? "Ativo"
                                      : "Inativo"}
                                  </Badge>
                                </TableCell>

                                <TableCell className="whitespace-nowrap">
                                  {formatDateTime(
                                    user.createdAt,
                                  )}
                                </TableCell>
                              </TableRow>
                            ),
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </AppDialogSection>

                <AppDialogSection
                  title="Convites"
                  description="Histórico de convites enviados para a organização."
                  action={
                    <Mail className="size-4 text-muted-foreground" />
                  }
                >
                  {invitations.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Nenhum convite encontrado.
                    </p>
                  ) : (
                    <div className="overflow-x-auto rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>
                              Convidado
                            </TableHead>

                            <TableHead>
                              Papel
                            </TableHead>

                            <TableHead>
                              Status
                            </TableHead>

                            <TableHead>
                              Validade
                            </TableHead>
                          </TableRow>
                        </TableHeader>

                        <TableBody>
                          {invitations.map(
                            (
                              invitation,
                            ) => (
                              <TableRow
                                key={
                                  invitation.id
                                }
                              >
                                <TableCell>
                                  <p className="font-medium">
                                    {
                                      invitation.name
                                    }
                                  </p>

                                  <p className="text-xs text-muted-foreground">
                                    {
                                      invitation.email
                                    }
                                  </p>
                                </TableCell>

                                <TableCell>
                                  {
                                    organizationRoleLabels[
                                      invitation.role
                                    ]
                                  }
                                </TableCell>

                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={
                                      invitationStatusClassNames[
                                        invitation.status
                                      ]
                                    }
                                  >
                                    {
                                      invitationStatusLabels[
                                        invitation.status
                                      ]
                                    }
                                  </Badge>
                                </TableCell>

                                <TableCell className="whitespace-nowrap">
                                  {formatDateTime(
                                    invitation.expiresAt,
                                  )}
                                </TableCell>
                              </TableRow>
                            ),
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </AppDialogSection>
              </>
            )}
          </AppDialogBody>

          <AppDialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant={
                currentOrganization.active
                  ? "destructive"
                  : "default"
              }
              disabled={
                updateStatusMutation.isPending
              }
              onClick={() =>
                setRequestedStatus(
                  !currentOrganization.active,
                )
              }
            >
              {currentOrganization.active ? (
                <>
                  <PauseCircle className="mr-2 size-4" />
                  Suspender organização
                </>
              ) : (
                <>
                  <PlayCircle className="mr-2 size-4" />
                  Reativar organização
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setOpen(false)
              }
            >
              Fechar
            </Button>
          </AppDialogFooter>
        </AppDialogContent>
      </Dialog>

      <AlertDialog
        open={
          requestedStatus !== null
        }
        onOpenChange={(value) => {
          if (!value) {
            setRequestedStatus(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              {requestedStatus ? (
                <PlayCircle className="size-5" />
              ) : (
                <PauseCircle className="size-5 text-destructive" />
              )}
            </AlertDialogMedia>

            <AlertDialogTitle>
              {requestedStatus
                ? "Reativar organização?"
                : "Suspender organização?"}
            </AlertDialogTitle>

            <AlertDialogDescription>
              {requestedStatus
                ? `Os usuários de ${currentOrganization.name} voltarão a acessar os dados da organização.`
                : `Todos os usuários de ${currentOrganization.name} perderão temporariamente o acesso. Os dados e vínculos serão preservados.`}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>
              Cancelar
            </AlertDialogCancel>

            <AlertDialogAction
              variant={
                requestedStatus
                  ? "default"
                  : "destructive"
              }
              disabled={
                updateStatusMutation.isPending
              }
              onClick={
                handleUpdateStatus
              }
            >
              {requestedStatus
                ? "Reativar"
                : "Suspender"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}