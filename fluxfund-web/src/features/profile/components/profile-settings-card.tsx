import { zodResolver } from "@hookform/resolvers/zod"
import { Mail, Save, UserRound } from "lucide-react"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
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
import { Skeleton } from "@/components/ui/skeleton"
import { getApiErrorMessage } from "@/utils/api-error"
import { useProfile } from "../hooks/use-profile"
import { useUpdateProfile } from "../hooks/use-update-profile"
import {
  updateProfileSchema,
  type UpdateProfileFormData,
  type UpdateProfileFormInput,
} from "../profile-schema"

export function ProfileSettingsCard() {
  const profileQuery = useProfile()
  const updateProfileMutation = useUpdateProfile()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<UpdateProfileFormInput, unknown, UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: "",
    },
  })

  const profile = profileQuery.data
  const currentName = watch("name")
  const hasChanged = Boolean(profile && currentName !== profile.name)

  useEffect(() => {
    if (!profile) {
      return
    }

    reset({
      name: profile.name,
    })
  }, [profile, reset])

  function handleUpdateProfile(data: UpdateProfileFormData) {
    updateProfileMutation.mutate(data, {
      onSuccess: () => {
        toast.success("Perfil atualizado com sucesso.")
      },
      onError: (error) => {
        toast.error(
          getApiErrorMessage(
            error,
            "Não foi possível atualizar seu perfil.",
          ),
        )
      },
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <UserRound className="size-5 text-muted-foreground" />
              Meu perfil
            </CardTitle>

            <CardDescription>
              Atualize as informações básicas usadas na sua sessão e no cabeçalho do sistema.
            </CardDescription>
          </div>

          <Badge variant="outline">Conta pessoal</Badge>
        </div>
      </CardHeader>

      <CardContent>
        {profileQuery.isLoading ? (
          <ProfileSettingsSkeleton />
        ) : profileQuery.isError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            Não foi possível carregar seu perfil.
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit(handleUpdateProfile)}>
            <div className="grid gap-4 md:grid-cols-[1fr_320px]">
              <div className="space-y-2">
                <Label htmlFor="profileName">Nome</Label>
                <Input id="profileName" {...register("name")} />
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>E-mail de acesso</Label>
                <div className="flex h-10 items-center gap-2 rounded-md border bg-muted/50 px-3 text-sm text-muted-foreground">
                  <Mail className="size-4" />
                  <span className="truncate">{profile?.email}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  A alteração de e-mail ficará para um fluxo futuro com confirmação.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t pt-4 md:flex-row md:items-center md:justify-between">
              <p className="text-xs text-muted-foreground">
                Alterações no nome atualizam também a saudação do sistema.
              </p>

              <Button
                type="submit"
                disabled={!hasChanged || updateProfileMutation.isPending}
              >
                <Save className="mr-2 size-4" />
                {updateProfileMutation.isPending ? "Salvando..." : "Salvar perfil"}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}

function ProfileSettingsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-[1fr_320px]">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
      <div className="flex justify-end">
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  )
}
