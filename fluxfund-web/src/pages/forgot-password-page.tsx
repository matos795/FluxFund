import { zodResolver } from "@hookform/resolvers/zod"
import {
  ArrowLeft,
  CheckCircle2,
  Mail,
} from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { Link } from "react-router-dom"
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
import { useRequestPasswordReset } from "@/features/password-reset/hooks/use-request-password-reset"

const formSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Informe seu e-mail.")
    .email("Informe um e-mail válido."),
})

type FormData = z.infer<typeof formSchema>

export function ForgotPasswordPage() {
  const requestMutation =
    useRequestPasswordReset()

  const [requestCompleted, setRequestCompleted] =
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
      email: "",
    },
  })

  async function handleRequest(
    data: FormData,
  ) {
    setSubmitError(null)

    try {
      await requestMutation.mutateAsync({
        email: data.email.trim(),
      })

      setRequestCompleted(true)
    } catch {
      setSubmitError(
        "Não foi possível processar a solicitação. Tente novamente.",
      )
    }
  }

  if (requestCompleted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="size-6" />
            </div>

            <CardTitle className="mt-3 text-xl">
              Verifique seu e-mail
            </CardTitle>

            <CardDescription>
              Caso exista uma conta com o e-mail
              informado, enviaremos um link para
              redefinir sua senha.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
              O link possui prazo de validade. Verifique
              também as pastas de spam e promoções.
            </div>

            <Button
              className="w-full"
              asChild
            >
              <Link to="/login">
                Voltar para o login
              </Link>
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() =>
                setRequestCompleted(false)
              }
            >
              Solicitar novamente
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
            <Mail className="size-5" />
          </div>

          <CardTitle className="text-xl">
            Esqueci minha senha
          </CardTitle>

          <CardDescription>
            Informe o e-mail utilizado para acessar o
            FluxFund. Enviaremos as instruções para criar
            uma nova senha.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            className="space-y-4"
            onSubmit={handleSubmit(
              handleRequest,
            )}
          >
            <div className="space-y-2">
              <Label htmlFor="recovery-email">
                E-mail
              </Label>

              <Input
                id="recovery-email"
                type="email"
                autoComplete="email"
                placeholder="seu@email.com"
                {...register("email")}
              />

              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            {submitError && (
              <p className="text-sm text-destructive">
                {submitError}
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={
                requestMutation.isPending
              }
            >
              {requestMutation.isPending
                ? "Enviando..."
                : "Enviar link de recuperação"}
            </Button>

            <Button
              variant="ghost"
              className="w-full"
              asChild
            >
              <Link to="/login">
                <ArrowLeft className="mr-2 size-4" />
                Voltar para o login
              </Link>
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}