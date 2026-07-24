import {
  Ban,
  Clock3,
  Link2,
  Mail,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { ConfirmActionDialog } from "@/components/layout/confirm-action-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { organizationRoleLabels } from "@/features/organization-users/organization-user-labels"
import { getApiErrorMessage } from "@/utils/api-error"

import { useCancelOrganizationUserInvitation } from "../hooks/use-cancel-organization-user-invitation"
import { useRegenerateOrganizationUserInvitationLink } from "../hooks/use-regenerate-organization-user-invitation-link"
import {
  invitationStatusClassNames,
  invitationStatusLabels,
} from "../organization-user-invitation-labels"
import type { OrganizationUserInvitation } from "../organization-user-invitation-types"

type Props = {
  invitations: OrganizationUserInvitation[]
  onInvitationUrlGenerated: (
    invitationUrl: string,
  ) => void
}

export function OrganizationUserInvitationsList({
  invitations,
  onInvitationUrlGenerated,
}: Props) {
  const [invitationToCancel, setInvitationToCancel] =
    useState<OrganizationUserInvitation | null>(null)

  const [
    invitationToRegenerate,
    setInvitationToRegenerate,
  ] =
    useState<OrganizationUserInvitation | null>(
      null,
    )

  const cancelMutation =
    useCancelOrganizationUserInvitation()

  const regenerateMutation =
    useRegenerateOrganizationUserInvitationLink()

  if (invitations.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-center">
        <Mail className="mx-auto size-7 text-muted-foreground" />

        <p className="mt-3 font-medium">
          Nenhum convite registrado
        </p>

        <p className="mt-1 text-sm text-muted-foreground">
          Use o botão Convidar usuário para criar o
          primeiro acesso.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {invitations.map((invitation) => {
          const canRegenerate =
            invitation.status === "PENDING" ||
            invitation.status === "EXPIRED"

          const canCancel =
            invitation.status === "PENDING"

          return (
            <Card key={invitation.id}>
              <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center">
                <div className="flex min-w-0 flex-1 gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                    <Mail className="size-4" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">
                        {invitation.name}
                      </p>

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
                    </div>

                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {invitation.email}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>
                        Papel:{" "}
                        {
                          organizationRoleLabels[
                            invitation.role
                          ]
                        }
                      </span>

                      <span className="flex items-center gap-1">
                        <Clock3 className="size-3" />
                        Expira em{" "}
                        {new Intl.DateTimeFormat(
                          "pt-BR",
                          {
                            dateStyle: "short",
                            timeStyle: "short",
                          },
                        ).format(
                          new Date(
                            invitation.expiresAt,
                          ),
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {(canRegenerate || canCancel) && (
                  <div className="flex flex-wrap gap-2">
                    {canRegenerate && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setInvitationToRegenerate(
                            invitation,
                          )
                        }
                      >
                        <Link2 className="mr-2 size-4" />
                        Gerar novo link
                      </Button>
                    )}

                    {canCancel && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setInvitationToCancel(
                            invitation,
                          )
                        }
                      >
                        <Ban className="mr-2 size-4" />
                        Cancelar
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <ConfirmActionDialog
        open={Boolean(invitationToCancel)}
        onOpenChange={(open) => {
          if (!open) {
            setInvitationToCancel(null)
          }
        }}
        title="Cancelar convite?"
        description={
          <>
            O link enviado para{" "}
            <strong>
              {invitationToCancel?.email}
            </strong>{" "}
            deixará de funcionar.
          </>
        }
        confirmLabel="Cancelar convite"
        pendingLabel="Cancelando..."
        isPending={cancelMutation.isPending}
        isDestructive
        onConfirm={() => {
          if (!invitationToCancel) {
            return
          }

          cancelMutation.mutate(
            invitationToCancel.id,
            {
              onSuccess: () => {
                toast.success(
                  "Convite cancelado.",
                )

                setInvitationToCancel(null)
              },

              onError: (error) => {
                toast.error(
                  getApiErrorMessage(
                    error,
                    "Não foi possível cancelar o convite.",
                  ),
                )
              },
            },
          )
        }}
      />

      <ConfirmActionDialog
        open={Boolean(invitationToRegenerate)}
        onOpenChange={(open) => {
          if (!open) {
            setInvitationToRegenerate(null)
          }
        }}
        title="Gerar novo link?"
        description={
          <>
            O link anterior de{" "}
            <strong>
              {invitationToRegenerate?.email}
            </strong>{" "}
            deixará de funcionar imediatamente.
          </>
        }
        confirmLabel="Gerar novo link"
        pendingLabel="Gerando..."
        isPending={regenerateMutation.isPending}
        onConfirm={() => {
          if (!invitationToRegenerate) {
            return
          }

          regenerateMutation.mutate(
            invitationToRegenerate.id,
            {
              onSuccess: (response) => {
                setInvitationToRegenerate(
                  null,
                )

                onInvitationUrlGenerated(
                  response.invitationUrl,
                )
              },

              onError: (error) => {
                toast.error(
                  getApiErrorMessage(
                    error,
                    "Não foi possível gerar outro link.",
                  ),
                )
              },
            },
          )
        }}
      />
    </>
  )
}