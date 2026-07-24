import { zodResolver } from "@hookform/resolvers/zod"
import {
  CheckCircle2,
  KeyRound,
  ShieldCheck,
} from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import {
  Link,
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
import { useResetPassword } from "@/features/password-reset/hooks/use-reset-password"

const formSchema = z
  .object({
    newPassword: z
      .string()
      .min(
        8,
        "A senha deve possuir pelo menos 8 caracteres.",
      )
      .max(
        100,
        "A senha deve possuir até 100 caracteres.",
      ),

    passwordConfirmation: z
      .string()
      .min(
        1,
        "Confirme a nova senha.",
      ),
  })
  .refine(
    (data) =>
      data.newPassword ===
      data.passwordConfirmation,

    {
      path: [
        "passwordConfirmation",
      ],

      message:
        "As senhas não conferem.",
    },
  )

type FormData = z.infer<typeof formSchema>

export function ResetPasswordPage() {
  const [searchParams] =
    useSearchParams()

  const token =
    searchParams.get("token")?.trim() ??
    ""

  const resetMutation =
    useResetPassword()

  const [resetCompleted, setResetCompleted] =
    useState(false)

  const [submitError, setSubmitError] =
    useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),

    defaultValues: {
      newPassword: "",
      passwordConfirmation: "",
    },
  })

  async function handleReset(
    data: FormData,
  ) {
    if (!token) {
      return
    }

    setSubmitError(null)

    try {
      await resetMutation.mutateAsync({
        token,
        newPassword:
          data.newPassword,
      })

      setResetCompleted(true)
    } catch {
      setSubmitError(
        "Este link é inválido, expirou ou já foi utilizado. Solicite uma nova recuperação de senha.",
      )
    }
  }

  if (!token) {
    return (
      <PasswordResetMessage
        title="Link inválido"
        description="O token de recuperação não foi encontrado neste endereço."
      />
    )
  }

  if (resetCompleted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="size-6" />
            </div>

            <CardTitle className="mt-3 text-xl">
              Senha alterada
            </CardTitle>

            <CardDescription>
              Sua nova senha foi cadastrada com
              sucesso. Agora você já pode entrar no
              FluxFund.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Button
              className="w-full"
              asChild
            >
              <Link to="/login">
                Entrar no FluxFund
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-2 flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <KeyRound className="size-5" />
          </div>

          <CardTitle className="text-xl">
            Crie uma nova senha
          </CardTitle>

          <CardDescription>
            Informe e confirme a nova senha que será
            utilizada para acessar sua conta.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            className="space-y-4"
            onSubmit={handleSubmit(
              handleReset,
            )}
          >
            <div className="space-y-2">
              <Label htmlFor="new-password">
                Nova senha
              </Label>

              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                {...register(
                  "newPassword",
                )}
              />

              {errors.newPassword && (
                <p className="text-sm text-destructive">
                  {
                    errors.newPassword
                      .message
                  }
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password-confirmation">
                Confirmar nova senha
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
                    errors
                      .passwordConfirmation
                      .message
                  }
                </p>
              )}
            </div>

            <div className="flex gap-3 rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" />

              <p>
                Use uma senha que não seja
                compartilhada com outros sistemas.
              </p>
            </div>

            {submitError && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                {submitError}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={
                resetMutation.isPending
              }
            >
              {resetMutation.isPending
                ? "Alterando senha..."
                : "Alterar senha"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}

type PasswordResetMessageProps = {
  title: string
  description: string
}

function PasswordResetMessage({
  title,
  description,
}: PasswordResetMessageProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {title}
          </CardTitle>

          <CardDescription>
            {description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          <Button
            className="w-full"
            asChild
          >
            <Link to="/forgot-password">
              Solicitar novo link
            </Link>
          </Button>

          <Button
            variant="ghost"
            className="w-full"
            asChild
          >
            <Link to="/login">
              Voltar para o login
            </Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}