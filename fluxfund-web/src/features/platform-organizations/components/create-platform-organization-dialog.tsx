import { zodResolver } from "@hookform/resolvers/zod"
import {
  Building2,
  Check,
  CheckCircle2,
  Copy,
  MailCheck,
  MailWarning,
  UserRoundPlus,
} from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
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
import { getApiErrorMessage } from "@/utils/api-error"

import { useCreatePlatformOrganization } from "../hooks/use-create-platform-organization"
import {
  createPlatformOrganizationSchema,
  type CreatePlatformOrganizationFormData,
  type CreatePlatformOrganizationFormInput,
} from "../platform-organization-schema"
import type { CreatePlatformOrganizationResponse } from "../platform-organization-types"

export function CreatePlatformOrganizationDialog() {
  const [open, setOpen] =
    useState(false)

  const [result, setResult] =
    useState<CreatePlatformOrganizationResponse | null>(
      null,
    )

  const [copied, setCopied] =
    useState(false)

  const createMutation =
    useCreatePlatformOrganization()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<
    CreatePlatformOrganizationFormInput,
    unknown,
    CreatePlatformOrganizationFormData
  >({
    resolver: zodResolver(
      createPlatformOrganizationSchema,
    ),

    defaultValues: {
      organizationName: "",
      ownerName: "",
      ownerEmail: "",
    },
  })

  function handleOpenChange(
    value: boolean,
  ) {
    if (!value) {
      reset()
      setResult(null)
      setCopied(false)
    }

    setOpen(value)
  }

  function handleCreate(
    data: CreatePlatformOrganizationFormData,
  ) {
    createMutation.mutate(
      data,

      {
        onSuccess: (response) => {
          setResult(response)

          if (
            response
              .ownerInvitation
              .emailSent
          ) {
            toast.success(
              "Cliente criado e convite enviado por e-mail.",
            )
          } else {
            toast.warning(
              "Cliente criado, mas o e-mail não foi enviado. Copie o link do convite.",
            )
          }
        },

        onError: (error) => {
          toast.error(
            getApiErrorMessage(
              error,
              "Não foi possível criar o cliente.",
            ),
          )
        },
      },
    )
  }

  async function handleCopyLink() {
    const invitationUrl =
      result
        ?.ownerInvitation
        .invitationUrl

    if (!invitationUrl) {
      return
    }

    try {
      await navigator.clipboard.writeText(
        invitationUrl,
      )

      setCopied(true)
      toast.success(
        "Link copiado.",
      )

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
      onOpenChange={
        handleOpenChange
      }
    >
      <DialogTrigger asChild>
        <Button type="button">
          <Building2 className="mr-2 size-4" />
          Novo cliente
        </Button>
      </DialogTrigger>

      <AppDialogContent size="md">
        <AppDialogHeader
          icon={
            result ? (
              <CheckCircle2 className="size-4 text-emerald-600" />
            ) : (
              <UserRoundPlus className="size-4 text-muted-foreground" />
            )
          }
          title={
            result
              ? "Cliente criado"
              : "Cadastrar novo cliente"
          }
          description={
            result
              ? "A organização e o convite do primeiro proprietário foram criados."
              : "Cadastre a organização e envie o primeiro convite de proprietário."
          }
        />

        {result ? (
          <>
            <AppDialogBody className="space-y-4">
              <div className="rounded-lg border bg-muted/40 p-4">
                <p className="font-medium">
                  {
                    result
                      .organization
                      .name
                  }
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Responsável:{" "}
                  {
                    result
                      .ownerInvitation
                      .invitation
                      .name
                  }
                </p>

                <p className="text-sm text-muted-foreground">
                  {
                    result
                      .ownerInvitation
                      .invitation
                      .email
                  }
                </p>
              </div>

              <div className="flex gap-3 rounded-lg border p-4">
                {result
                  .ownerInvitation
                  .emailSent ? (
                  <MailCheck className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                ) : (
                  <MailWarning className="mt-0.5 size-5 shrink-0 text-amber-600" />
                )}

                <div>
                  <p className="text-sm font-medium">
                    {result
                      .ownerInvitation
                      .emailSent
                      ? "Convite enviado"
                      : "Envio do e-mail falhou"}
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {result
                      .ownerInvitation
                      .emailSent
                      ? "O responsável recebeu o convite para criar a conta e acessar a organização."
                      : "A organização foi criada normalmente. Envie o link abaixo manualmente."}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <Label htmlFor="platform-invitation-url">
                  Link do convite
                </Label>

                <p className="mt-1 text-xs text-muted-foreground">
                  Este link será exibido somente agora.
                  Copie-o antes de fechar.
                </p>

                <div className="mt-3 flex gap-2">
                  <Input
                    id="platform-invitation-url"
                    readOnly
                    value={
                      result
                        .ownerInvitation
                        .invitationUrl
                    }
                  />

                  <Button
                    type="button"
                    variant="outline"
                    onClick={
                      handleCopyLink
                    }
                  >
                    {copied ? (
                      <Check className="size-4" />
                    ) : (
                      <Copy className="size-4" />
                    )}

                    <span className="sr-only">
                      Copiar link
                    </span>
                  </Button>
                </div>
              </div>
            </AppDialogBody>

            <AppDialogFooter>
              <Button
                type="button"
                onClick={() =>
                  handleOpenChange(
                    false,
                  )
                }
              >
                Concluir
              </Button>
            </AppDialogFooter>
          </>
        ) : (
          <form
            className="contents"
            onSubmit={handleSubmit(
              handleCreate,
            )}
          >
            <AppDialogBody className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="platform-organization-name">
                  Nome da organização
                </Label>

                <Input
                  id="platform-organization-name"
                  placeholder="Ex.: Igreja Esperança"
                  {...register(
                    "organizationName",
                  )}
                />

                {errors.organizationName && (
                  <p className="text-sm text-destructive">
                    {
                      errors
                        .organizationName
                        .message
                    }
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="platform-owner-name">
                  Nome do responsável
                </Label>

                <Input
                  id="platform-owner-name"
                  placeholder="Nome completo"
                  {...register(
                    "ownerName",
                  )}
                />

                {errors.ownerName && (
                  <p className="text-sm text-destructive">
                    {
                      errors
                        .ownerName
                        .message
                    }
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="platform-owner-email">
                  E-mail do responsável
                </Label>

                <Input
                  id="platform-owner-email"
                  type="email"
                  autoComplete="email"
                  placeholder="responsavel@empresa.com"
                  {...register(
                    "ownerEmail",
                  )}
                />

                {errors.ownerEmail && (
                  <p className="text-sm text-destructive">
                    {
                      errors
                        .ownerEmail
                        .message
                    }
                  </p>
                )}
              </div>

              <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
                O responsável receberá o papel de
                proprietário e poderá cadastrar os
                demais usuários da organização.
              </div>
            </AppDialogBody>

            <AppDialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={
                  createMutation.isPending
                }
                onClick={() =>
                  handleOpenChange(
                    false,
                  )
                }
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                disabled={
                  createMutation.isPending
                }
              >
                {createMutation.isPending
                  ? "Criando cliente..."
                  : "Criar e enviar convite"}
              </Button>
            </AppDialogFooter>
          </form>
        )}
      </AppDialogContent>
    </Dialog>
  )
}