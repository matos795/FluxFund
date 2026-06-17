import { MoreHorizontal } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getApiErrorMessage } from "@/utils/api-error"
import type { OrganizationUser } from "../organization-user-types"
import { useUpdateOrganizationUserStatus } from "../hooks/use-update-organization-user-status"
import { useUpdateOrganizationUserRole } from "../hooks/use-update-organization-user-role"

type OrganizationUserActionsProps = {
  organizationUser: OrganizationUser
}

export function OrganizationUserActions({
  organizationUser,
}: OrganizationUserActionsProps) {
  const updateStatusMutation = useUpdateOrganizationUserStatus()
  const updateRoleMutation = useUpdateOrganizationUserRole()

  const isOwner = organizationUser.role === "OWNER"

  function handleUpdateRole(role: "ADMIN" | "FINANCE" | "VIEWER") {
    updateRoleMutation.mutate(
      {
        userId: organizationUser.userId,
        data: { role },
      },
      {
        onSuccess: () => {
          toast.success("Papel do usuário atualizado.")
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

  function handleUpdateStatus(active: boolean) {
    updateStatusMutation.mutate(
      {
        userId: organizationUser.userId,
        data: { active },
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Ações</DropdownMenuLabel>

        <DropdownMenuSeparator />

        {!isOwner && (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Alterar papel
            </DropdownMenuLabel>

            <DropdownMenuItem onClick={() => handleUpdateRole("ADMIN")}>
              Administrador
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => handleUpdateRole("FINANCE")}>
              Financeiro
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => handleUpdateRole("VIEWER")}>
              Visualização
            </DropdownMenuItem>

            <DropdownMenuSeparator />
          </>
        )}

        {organizationUser.active ? (
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => handleUpdateStatus(false)}
          >
            Desativar acesso
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => handleUpdateStatus(true)}>
            Reativar acesso
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}