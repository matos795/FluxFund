import { Copy, Link2, Mail, UserRoundCheck } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import {
  AppDialogBody,
  AppDialogContent,
  AppDialogFooter,
  AppDialogHeader,
} from "@/components/layout/app-dialog"
import { Button } from "@/components/ui/button"
import { Dialog } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

import { CreateOrganizationUserInvitationDialog } from "@/features/organization-user-invitations/components/create-organization-user-invitation-dialog"
import { OrganizationUserInvitationsList } from "@/features/organization-user-invitations/components/organization-user-invitations-list"
import { useOrganizationUserInvitations } from "@/features/organization-user-invitations/hooks/use-organization-user-invitations"

import { useOrganizationUsers } from "../hooks/use-organization-users"
import { OrganizationUsersTable } from "./organization-users-table"
import { CreateOrganizationUserDialog } from "./create-organization-user-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

export function OrganizationUsersSettingsCard() {
  const usersQuery =
    useOrganizationUsers()

  const invitationsQuery =
    useOrganizationUserInvitations()

  const [
    generatedInvitationUrl,
    setGeneratedInvitationUrl,
  ] = useState<string | null>(null)

  async function handleCopyGeneratedLink() {
    if (!generatedInvitationUrl) {
      return
    }

    try {
      await navigator.clipboard.writeText(
        generatedInvitationUrl,
      )

      toast.success(
        "Link do convite copiado.",
      )
    } catch {
      toast.error(
        "Não foi possível copiar o link automaticamente.",
      )
    }
  }

  function handleGeneratedLinkDialogChange(
    open: boolean,
  ) {
    if (!open) {
      setGeneratedInvitationUrl(null)
    }
  }

  if (
    usersQuery.isLoading ||
    invitationsQuery.isLoading
  ) {
    return (
      <div className="rounded-lg border p-6 text-sm text-muted-foreground">
        Carregando usuários e convites...
      </div>
    )
  }

  if (
    usersQuery.isError ||
    invitationsQuery.isError
  ) {
    return (
      <div className="rounded-lg border p-6 text-sm text-destructive">
        Não foi possível carregar os usuários
        e convites da organização.
      </div>
    )
  }

  return (
    <>
      <Tabs
        defaultValue="invitations"
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-2 gap-2 rounded-xl border bg-muted/50 p-1 group-data-horizontal/tabs:h-auto">
          <TabsTrigger
            value="invitations"
            className="h-full min-h-12 min-w-0 justify-start gap-3 px-4 py-2.5"
          >
            <Mail className="size-4" />

            <span className="truncate">
              Convites
            </span>

            <Badge
              variant="secondary"
              className="ml-auto shrink-0"
            >
              {
                (invitationsQuery.data ?? [])
                  .length
              }
            </Badge>
          </TabsTrigger>

          <TabsTrigger
            value="active-users"
            className="h-full min-h-12 min-w-0 justify-start gap-3 px-4 py-2.5"
          >
            <UserRoundCheck className="size-4" />

            <span className="truncate">
              Usuários
            </span>

            <Badge
              variant="secondary"
              className="ml-auto shrink-0"
            >
              {(usersQuery.data ?? []).length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="invitations"
          className="mt-0 space-y-4"
        >
          <div className="flex flex-col gap-3 rounded-xl border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold">
                Convites de acesso
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                Convide pessoas e acompanhe o estado
                dos links enviados.
              </p>
            </div>

            <CreateOrganizationUserInvitationDialog />
          </div>

          <OrganizationUserInvitationsList
            invitations={
              invitationsQuery.data ?? []
            }
            onInvitationUrlGenerated={
              setGeneratedInvitationUrl
            }
          />
        </TabsContent>

        <TabsContent
          value="active-users"
          className="mt-0 space-y-4"
        >
          <div className="flex flex-col gap-3 rounded-xl border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold">
                Usuários com acesso
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                Gerencie papéis e acessos já
                associados à organização.
              </p>
            </div>

            <CreateOrganizationUserDialog />
          </div>

          <OrganizationUsersTable
            users={usersQuery.data ?? []}
          />
        </TabsContent>
      </Tabs>

      <Dialog
        open={
          generatedInvitationUrl !== null
        }
        onOpenChange={
          handleGeneratedLinkDialogChange
        }
      >
        <AppDialogContent size="md">
          <AppDialogHeader
            icon={
              <Link2 className="size-4 text-muted-foreground" />
            }
            title="Novo link gerado"
            description="O link anterior deixou de funcionar. Copie e envie este novo link para a pessoa convidada."
          />

          <AppDialogBody className="space-y-4">
            <div className="rounded-lg border bg-muted/40 p-4">
              <p className="text-sm font-medium">
                Link do convite
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Este link será mostrado somente
                agora. Copie-o antes de fechar a
                janela.
              </p>

              <div className="mt-3 flex gap-2">
                <Input
                  readOnly
                  value={
                    generatedInvitationUrl ?? ""
                  }
                />

                <Button
                  type="button"
                  variant="outline"
                  aria-label="Copiar link"
                  onClick={
                    handleCopyGeneratedLink
                  }
                >
                  <Copy className="size-4" />
                </Button>
              </div>
            </div>
          </AppDialogBody>

          <AppDialogFooter>
            <Button
              type="button"
              onClick={() =>
                setGeneratedInvitationUrl(
                  null,
                )
              }
            >
              Concluir
            </Button>
          </AppDialogFooter>
        </AppDialogContent>
      </Dialog>
    </>
  )
}