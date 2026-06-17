import { zodResolver } from "@hookform/resolvers/zod"
import { Building2, Save } from "lucide-react"
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
import { usePermissions } from "@/features/auth/hooks/use-permissions"
import { getApiErrorMessage } from "@/utils/api-error"
import { useOrganizationProfile } from "../hooks/use-organization-profile"
import { useUpdateOrganizationProfile } from "../hooks/use-update-organization-profile"
import {
  updateOrganizationProfileSchema,
  type UpdateOrganizationProfileFormData,
  type UpdateOrganizationProfileFormInput,
} from "../organization-profile-schema"

export function OrganizationProfileSettingsCard() {
  const { canAdmin } = usePermissions()
  const organizationProfileQuery = useOrganizationProfile()
  const updateOrganizationProfileMutation = useUpdateOrganizationProfile()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<
    UpdateOrganizationProfileFormInput,
    unknown,
    UpdateOrganizationProfileFormData
  >({
    resolver: zodResolver(updateOrganizationProfileSchema),
    defaultValues: {
      name: "",
    },
  })

  const organizationProfile = organizationProfileQuery.data
  const currentName = watch("name")
  const hasChanged = Boolean(
    organizationProfile && currentName !== organizationProfile.name,
  )

  useEffect(() => {
    if (!organizationProfile) {
      return
    }

    reset({
      name: organizationProfile.name,
    })
  }, [organizationProfile, reset])

  function handleUpdateOrganization(data: UpdateOrganizationProfileFormData) {
    updateOrganizationProfileMutation.mutate(data, {
      onSuccess: () => {
        toast.success("Organização atualizada com sucesso.")
      },
      onError: (error) => {
        toast.error(
          getApiErrorMessage(
            error,
            "Não foi possível atualizar a organização.",
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
              <Building2 className="size-5 text-muted-foreground" />
              Perfil da organização
            </CardTitle>

            <CardDescription>
              Gerencie as informações básicas da organização ativa. Essas informações aparecem na navegação e futuramente nos relatórios formais.
            </CardDescription>
          </div>

          {organizationProfile?.active === false ? (
            <Badge variant="secondary">Inativa</Badge>
          ) : (
            <Badge variant="outline">Organização ativa</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {organizationProfileQuery.isLoading ? (
          <OrganizationProfileSkeleton />
        ) : organizationProfileQuery.isError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            Não foi possível carregar os dados da organização.
          </div>
        ) : (
          <form
            className="space-y-5"
            onSubmit={handleSubmit(handleUpdateOrganization)}
          >
            <div className="grid gap-4 rounded-xl border p-4 md:grid-cols-[1fr_260px]">
              <div className="space-y-2">
                <Label htmlFor="organizationName">Nome da organização</Label>
                <Input
                  id="organizationName"
                  disabled={!canAdmin}
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Escopo atual</p>
                <p className="mt-1">
                  Alterar este nome não muda dados financeiros, apenas a identificação da organização.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t pt-4 md:flex-row md:items-center md:justify-between">
              {!canAdmin ? (
                <Badge variant="outline">Somente OWNER/ADMIN podem editar</Badge>
              ) : (
                <p className="text-xs text-muted-foreground">
                  A alteração atualiza também o seletor de organização da sidebar.
                </p>
              )}

              {canAdmin && (
                <Button
                  type="submit"
                  disabled={!hasChanged || updateOrganizationProfileMutation.isPending}
                >
                  <Save className="mr-2 size-4" />
                  {updateOrganizationProfileMutation.isPending
                    ? "Salvando..."
                    : "Salvar organização"}
                </Button>
              )}
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}

function OrganizationProfileSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border p-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-2 h-10 w-full" />
      </div>
      <div className="flex justify-end">
        <Skeleton className="h-10 w-40" />
      </div>
    </div>
  )
}
