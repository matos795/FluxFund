import { zodResolver } from "@hookform/resolvers/zod"
import {
  CheckCircle2,
  Mail,
  ShieldCheck,
} from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import {
  useNavigate,
  useSearchParams,
} from "react-router-dom"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { organizationRoleLabels } from "@/features/organization-users/organization-user-labels"
import { useAcceptOrganizationUserInvitation } from "@/features/organization-user-invitations/hooks/use-accept-organization-user-invitation"
import { usePublicOrganizationUserInvitation } from "@/features/organization-user-invitations/hooks/use-public-organization-user-invitation"
import type { AcceptOrganizationUserInvitationResponse } from "@/features/organization-user-invitations/organization-user-invitation-types"
import { getApiErrorMessage } from "@/utils/api-error"

const formSchema = z.object({
  name: z
    .string()
    .trim()
    .max(150, "O nome deve possuir até 150 caracteres."),

  password: z
    .string()
    .max(100, "A senha deve possuir até 100 caracteres."),

  passwordConfirmation: z.string(),
})

type FormData = z.infer<typeof formSchema>

export function AcceptInvitationPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const token =
    searchParams.get("token")?.trim() ?? ""

  const { isAuthenticated, refreshUser } =
    useAuth()

  const detailsQuery =
    usePublicOrganizationUserInvitation(token)

  const acceptMutation =
    useAcceptOrganizationUserInvitation()

  const [acceptedInvitation, setAcceptedInvitation] =
    useState<AcceptOrganizationUserInvitationResponse | null>(
      null,
    )

  const [submitError, setSubmitError] =
    useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      password: "",
      passwordConfirmation: "",
    },
  })

  useEffect(() => {
    if (detailsQuery.data?.invitedName) {
      setValue(
        "name",
        detailsQuery.data.invitedName,
      )
    }
  }, [
    detailsQuery.data?.invitedName,
    setValue,
  ])

  async function handleAccept(data: FormData) {
    const details = detailsQuery.data

    if (!details) {
      return
    }

    if (details.requiresPassword) {
      if (data.name.trim().length < 2) {
        setError("name", {
          message: "Informe seu nome.",
        })
        return
      }

      if (data.password.length < 8) {
        setError("password", {
          message:
            "A senha deve possuir pelo menos 8 caracteres.",
        })
        return
      }

      if (
        data.password !==
        data.passwordConfirmation
      ) {
        setError("passwordConfirmation", {
          message: "As senhas não conferem.",
        })
        return
      }
    }

    setSubmitError(null)

    try {
      const response =
        await acceptMutation.mutateAsync({
          token,
          data: {
            name: details.requiresPassword
              ? data.name.trim()
              : null,

            password: details.requiresPassword
              ? data.password
              : null,
          },
        })

      if (isAuthenticated) {
        try {
          await refreshUser()
        } catch {
          // O convite já foi aceito.
          // A sessão será atualizada no próximo login.
        }
      }

      setAcceptedInvitation(response)
    } catch (error) {
      setSubmitError(
        getApiErrorMessage(
          error,
          "Não foi possível aceitar o convite.",
        ),
      )
    }
  }

  if (!token) {
    return (
      <InvitationMessageCard
        title="Link inválido"
        description="O token do convite não foi informado."
      />
    )
  }

  if (detailsQuery.isLoading) {
    return (
      <InvitationMessageCard
        title="Carregando convite"
        description="Estamos verificando os dados do convite."
      />
    )
  }

  if (detailsQuery.isError) {
    return (
      <InvitationMessageCard
        title="Convite indisponível"
        description="Este convite pode ter expirado, sido cancelado ou já utilizado."
      />
    )
  }

  if (acceptedInvitation) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle2 className="mx-auto size-10 text-emerald-600" />

            <CardTitle className="text-xl">
              Convite aceito
            </CardTitle>

            <CardDescription>
              Agora você possui acesso a{" "}
              {
                acceptedInvitation.organizationName
              }.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Button
              className="w-full"
              onClick={() =>
                navigate(
                  isAuthenticated ? "/" : "/login",
                  { replace: true },
                )
              }
            >
              {isAuthenticated
                ? "Ir para o FluxFund"
                : "Entrar no FluxFund"}
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  const details = detailsQuery.data!

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">
            Convite para o FluxFund
          </CardTitle>

          <CardDescription>
            Revise os dados e aceite o acesso à
            organização.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="mb-6 space-y-3 rounded-lg border bg-muted/40 p-4 text-sm">
            <div className="flex gap-2">
              <ShieldCheck className="mt-0.5 size-4" />

              <div>
                <p className="font-medium">
                  {details.organizationName}
                </p>

                <p className="text-muted-foreground">
                  Papel:{" "}
                  {
                    organizationRoleLabels[
                      details.role
                    ]
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="size-4" />
              {details.email}
            </div>
          </div>

          <form
            className="space-y-4"
            onSubmit={handleSubmit(handleAccept)}
          >
            {details.requiresPassword ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="invited-name">
                    Nome
                  </Label>

                  <Input
                    id="invited-name"
                    autoComplete="name"
                    {...register("name")}
                  />

                  {errors.name && (
                    <p className="text-sm text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invited-password">
                    Crie sua senha
                  </Label>

                  <Input
                    id="invited-password"
                    type="password"
                    autoComplete="new-password"
                    {...register("password")}
                  />

                  {errors.password && (
                    <p className="text-sm text-destructive">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password-confirmation">
                    Confirme a senha
                  </Label>

                  <Input
                    id="password-confirmation"
                    type="password"
                    autoComplete="new-password"
                    {...register(
                      "passwordConfirmation",
                    )}
                  />

                  {errors.passwordConfirmation && (
                    <p className="text-sm text-destructive">
                      {
                        errors.passwordConfirmation
                          .message
                      }
                    </p>
                  )}
                </div>
              </>
            ) : (
              <p className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
                Já existe uma conta com este e-mail.
                Sua senha atual continuará sendo usada.
              </p>
            )}

            {submitError && (
              <p className="text-sm text-destructive">
                {submitError}
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={acceptMutation.isPending}
            >
              {acceptMutation.isPending
                ? "Aceitando convite..."
                : "Aceitar convite"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}

type InvitationMessageCardProps = {
  title: string
  description: string
}

function InvitationMessageCard({
  title,
  description,
}: InvitationMessageCardProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            {description}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Button
            className="w-full"
            onClick={() =>
              window.location.assign("/login")
            }
          >
            Ir para o login
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}