import {
  Crown,
  MoreHorizontal,
  UserCheck,
  UserX,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

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
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { usePermissions } from "@/features/auth/hooks/use-permissions"
import type { OrganizationRole } from "@/features/auth/auth-types"
import { getApiErrorMessage } from "@/utils/api-error"

import { organizationRoleLabels } from "../organization-user-labels"
import type { OrganizationUser } from "../organization-user-types"
import { useUpdateOrganizationUserRole } from "../hooks/use-update-organization-user-role"
import { useUpdateOrganizationUserStatus } from "../hooks/use-update-organization-user-status"

type OrganizationUserActionsProps = {
  organizationUser: OrganizationUser
}

export function OrganizationUserActions({
  organizationUser,
}: OrganizationUserActionsProps) {
  const { session } = useAuth()

  const { canManageOwners } =
    usePermissions()

  const updateStatusMutation =
    useUpdateOrganizationUserStatus()

  const updateRoleMutation =
    useUpdateOrganizationUserRole()

  const [
    requestedStatus,
    setRequestedStatus,
  ] = useState<boolean | null>(null)

  const isCurrentUser =
    session?.user.id ===
    organizationUser.userId

  const targetIsOwner =
    organizationUser.role === "OWNER"

  const canManageTarget =
    !isCurrentUser &&
    (!targetIsOwner || canManageOwners)

  const isPending =
    updateStatusMutation.isPending ||
    updateRoleMutation.isPending

  const availableRoles: OrganizationRole[] =
    canManageOwners
      ? [
          "OWNER",
          "ADMIN",
          "FINANCE",
          "VIEWER",
        ]
      : [
          "ADMIN",
          "FINANCE",
          "VIEWER",
        ]

  const roleOptions =
    availableRoles.filter(
      (role) =>
        role !== organizationUser.role,
    )

  function handleUpdateRole(
    role: OrganizationRole,
  ) {
    updateRoleMutation.mutate(
      {
        userId:
          organizationUser.userId,

        data: {
          role,
        },
      },

      {
        onSuccess: () => {
          toast.success(
            "Papel do usuário atualizado.",
          )
        },

        onError: (error) => {
          toast.error(
            getApiErrorMessage(
              error,
              "Não foi possível alterar o papel do usuário.",
            ),
          )
        },
      },
    )
  }

  function handleUpdateStatus(
    active: boolean,
  ) {
    updateStatusMutation.mutate(
      {
        userId:
          organizationUser.userId,

        data: {
          active,
        },
      },

      {
        onSuccess: () => {
          toast.success(
            active
              ? "Acesso do usuário reativado."
              : "Acesso do usuário desativado.",
          )
        },

        onError: (error) => {
          toast.error(
            getApiErrorMessage(
              error,
              "Não foi possível alterar o acesso do usuário.",
            ),
          )
        },
      },
    )
  }

  function handleConfirmStatus() {
    if (requestedStatus === null) {
      return
    }

    handleUpdateStatus(
      requestedStatus,
    )

    setRequestedStatus(null)
  }

  if (!canManageTarget) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled
        title={
          isCurrentUser
            ? "Você não pode alterar seu próprio acesso."
            : "Somente um proprietário pode alterar outro proprietário."
        }
      >
        <MoreHorizontal className="size-4" />
      </Button>
    )
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={isPending}
          >
            <MoreHorizontal className="size-4" />

            <span className="sr-only">
              Abrir ações do usuário
            </span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            {organizationUser.name}
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          {roleOptions.length > 0 && (
            <>
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Alterar papel
              </DropdownMenuLabel>

              {roleOptions.map(
                (role) => (
                  <DropdownMenuItem
                    key={role}
                    disabled={isPending}
                    onClick={() =>
                      handleUpdateRole(role)
                    }
                  >
                    {role === "OWNER" && (
                      <Crown className="size-4" />
                    )}

                    {
                      organizationRoleLabels[
                        role
                      ]
                    }
                  </DropdownMenuItem>
                ),
              )}

              <DropdownMenuSeparator />
            </>
          )}

          {organizationUser.active ? (
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              disabled={isPending}
              onClick={() =>
                setRequestedStatus(false)
              }
            >
              <UserX className="size-4" />
              Desativar acesso
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              disabled={isPending}
              onClick={() =>
                setRequestedStatus(true)
              }
            >
              <UserCheck className="size-4" />
              Reativar acesso
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={
          requestedStatus !== null
        }
        onOpenChange={(open) => {
          if (!open) {
            setRequestedStatus(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              {requestedStatus ? (
                <UserCheck className="size-5" />
              ) : (
                <UserX className="size-5 text-destructive" />
              )}
            </AlertDialogMedia>

            <AlertDialogTitle>
              {requestedStatus
                ? "Reativar acesso?"
                : "Desativar acesso?"}
            </AlertDialogTitle>

            <AlertDialogDescription>
              {requestedStatus
                ? `${organizationUser.name} voltará a acessar esta organização com o papel de ${organizationRoleLabels[organizationUser.role]}.`
                : `${organizationUser.name} perderá o acesso a esta organização. Os dados cadastrados pela pessoa serão preservados.`}
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
              onClick={
                handleConfirmStatus
              }
            >
              {requestedStatus
                ? "Reativar acesso"
                : "Desativar acesso"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}