import { zodResolver } from "@hookform/resolvers/zod"
import {
  Check,
  Copy,
  MailPlus,
} from "lucide-react"
import { useState } from "react"
import {
  Controller,
  useForm,
} from "react-hook-form"
import { toast } from "sonner"

import {
  AppDialogBody,
  AppDialogContent,
  AppDialogFooter,
  AppDialogHeader,
} from "@/components/layout/app-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { organizationRoleLabels } from "@/features/organization-users/organization-user-labels"
import { getApiErrorMessage } from "@/utils/api-error"

import { useCreateOrganizationUserInvitation } from "../hooks/use-create-organization-user-invitation"
import {
  createOrganizationUserInvitationSchema,
  type CreateOrganizationUserInvitationFormData,
} from "../organization-user-invitation-schema"

export function CreateOrganizationUserInvitationDialog() {
  const [open, setOpen] = useState(false)
  const [invitationUrl, setInvitationUrl] =
    useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const createMutation =
    useCreateOrganizationUserInvitation()

  const [emailSent, setEmailSent] =
    useState(false)

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } =
    useForm<CreateOrganizationUserInvitationFormData>({
      resolver: zodResolver(
        createOrganizationUserInvitationSchema,
      ),
      defaultValues: {
        name: "",
        email: "",
        role: "FINANCE",
      },
    })

  function handleOpenChange(value: boolean) {
    if (!value) {
      reset()
      setEmailSent(false)
      setInvitationUrl(null)
      setCopied(false)
    }

    setOpen(value)
  }

  function handleCreate(
    data: CreateOrganizationUserInvitationFormData,
  ) {
    createMutation.mutate(data, {
      onSuccess: (response) => {
        setInvitationUrl(
          response.invitationUrl,
        )

        setEmailSent(
          response.emailSent,
        )

        if (response.emailSent) {
          toast.success(
            "Convite enviado por e-mail.",
          )
        } else {
          toast.warning(
            "Convite criado, mas o e-mail não foi enviado. Copie o link manualmente.",
          )
        }
      },

      onError: (error) => {
        toast.error(
          getApiErrorMessage(
            error,
            "Não foi possível criar o convite.",
          ),
        )
      },
    })
  }

  async function handleCopyLink() {
    if (!invitationUrl) {
      return
    }

    try {
      await navigator.clipboard.writeText(
        invitationUrl,
      )

      setCopied(true)
      toast.success("Link copiado.")

      window.setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch {
      toast.error(
        "Não foi possível copiar o link automaticamente.",
      )
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogTrigger asChild>
        <Button type="button">
          <MailPlus className="mr-2 size-4" />
          Convidar usuário
        </Button>
      </DialogTrigger>

      <AppDialogContent size="md">
        <AppDialogHeader
          icon={
            <MailPlus className="size-4 text-muted-foreground" />
          }
          title={
            invitationUrl
              ? "Convite criado"
              : "Convidar usuário"
          }
          description={
            invitationUrl
              ? "Este link será exibido somente agora. Copie-o antes de fechar."
              : "Crie um convite de acesso para a organização atual."
          }
        />

        {invitationUrl ? (
          <>
            <AppDialogBody className="space-y-4">
              <div className="rounded-lg border bg-muted/40 p-4">
                <p className="text-sm font-medium">
                  Link do convite
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  {emailSent
                    ? "O convite foi enviado por e-mail. O link também pode ser copiado abaixo."
                    : "O e-mail não foi enviado. Copie este link e envie manualmente para a pessoa."}
                </p>

                <div className="mt-3 flex gap-2">
                  <Input
                    readOnly
                    value={invitationUrl}
                  />

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCopyLink}
                  >
                    {copied ? (
                      <Check className="size-4" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </Button>
                </div>
              </div>
            </AppDialogBody>

            <AppDialogFooter>
              <Button
                type="button"
                onClick={() =>
                  handleOpenChange(false)
                }
              >
                Concluir
              </Button>
            </AppDialogFooter>
          </>
        ) : (
          <form
            className="contents"
            onSubmit={handleSubmit(handleCreate)}
          >
            <AppDialogBody className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invitation-name">
                  Nome
                </Label>

                <Input
                  id="invitation-name"
                  {...register("name")}
                />

                {errors.name && (
                  <p className="text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="invitation-email">
                  E-mail
                </Label>

                <Input
                  id="invitation-email"
                  type="email"
                  {...register("email")}
                />

                {errors.email && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label>Papel</Label>

                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value="ADMIN">
                          {
                            organizationRoleLabels.ADMIN
                          }
                        </SelectItem>

                        <SelectItem value="FINANCE">
                          {
                            organizationRoleLabels.FINANCE
                          }
                        </SelectItem>

                        <SelectItem value="VIEWER">
                          {
                            organizationRoleLabels.VIEWER
                          }
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              />

              <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
                A pessoa definirá a própria senha ao
                aceitar o convite. OWNER não pode ser
                concedido por convite.
              </div>
            </AppDialogBody>

            <AppDialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={createMutation.isPending}
                onClick={() =>
                  handleOpenChange(false)
                }
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending
                  ? "Criando convite..."
                  : "Criar convite"}
              </Button>
            </AppDialogFooter>
          </form>
        )}
      </AppDialogContent>
    </Dialog>
  )
}