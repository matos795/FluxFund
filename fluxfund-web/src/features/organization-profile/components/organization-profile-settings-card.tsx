import { zodResolver } from "@hookform/resolvers/zod"
import {
  Building2,
  Mail,
  MapPin,
  Save,
  ShieldCheck,
} from "lucide-react"
import { useEffect, type ReactNode } from "react"
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

import { formatCnpj, formatZipCode } from "../organization-profile-formatters"
import {
  type OrganizationProfile,
} from "../organization-profile-types"
import { useOrganizationProfile } from "../hooks/use-organization-profile"
import { useUpdateOrganizationProfile } from "../hooks/use-update-organization-profile"
import {
  updateOrganizationProfileSchema,
  type UpdateOrganizationProfileFormData,
  type UpdateOrganizationProfileFormInput,
} from "../organization-profile-schema"
import { OrganizationLogoSection } from "./organization-logo-section"

const emptyFormValues: UpdateOrganizationProfileFormInput = {
  name: "",
  legalName: "",
  cnpj: "",
  contactEmail: "",
  contactPhone: "",
  addressLine: "",
  addressNumber: "",
  addressComplement: "",
  neighborhood: "",
  city: "",
  state: "",
  zipCode: "",
  reviewerName: "",
  reviewerTitle: "",
  approverName: "",
  approverTitle: "",
}

export function OrganizationProfileSettingsCard() {
  const { canAdmin } = usePermissions()
  const organizationProfileQuery = useOrganizationProfile()
  const updateOrganizationProfileMutation = useUpdateOrganizationProfile()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<
    UpdateOrganizationProfileFormInput,
    unknown,
    UpdateOrganizationProfileFormData
  >({
    resolver: zodResolver(updateOrganizationProfileSchema),
    defaultValues: emptyFormValues,
  })

  const organizationProfile = organizationProfileQuery.data

  useEffect(() => {
    if (!organizationProfile) {
      return
    }

    reset(getFormValues(organizationProfile))
  }, [organizationProfile, reset])

  function handleUpdateOrganization(data: UpdateOrganizationProfileFormData) {
    updateOrganizationProfileMutation.mutate(data, {
      onSuccess: () => {
        toast.success("Perfil da organização atualizado com sucesso.")
      },
      onError: (error) => {
        toast.error(
          getApiErrorMessage(
            error,
            "Não foi possível atualizar o perfil da organização.",
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
              Configure a identidade institucional usada na navegação,
              relatórios e Dossiês de Fechamento.
            </CardDescription>
          </div>

          {organizationProfile?.active === false ? (
            <Badge variant="secondary">Organização inativa</Badge>
          ) : (
            <Badge variant="outline">Organização ativa</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {organizationProfileQuery.isLoading ? (
          <OrganizationProfileSkeleton />
        ) : organizationProfileQuery.isError || !organizationProfile ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            Não foi possível carregar os dados da organização.
          </div>
        ) : (
          <form
            className="space-y-6"
            onSubmit={handleSubmit(handleUpdateOrganization)}
          >
            <OrganizationLogoSection
              organization={organizationProfile}
              canManage={canAdmin}
            />

            <section className="space-y-4 rounded-xl border p-4">
              <SectionHeading
                icon={<Building2 className="size-4" />}
                title="Identificação"
                description="Dados principais que identificam a organização no sistema e nos documentos emitidos."
              />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="organizationName">
                    Nome de exibição
                  </Label>

                  <Input
                    id="organizationName"
                    disabled={!canAdmin}
                    placeholder="Ex.: Pregue a Palavra"
                    {...register("name")}
                  />

                  <FieldError message={errors.name?.message} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organizationLegalName">
                    Razão social
                  </Label>

                  <Input
                    id="organizationLegalName"
                    disabled={!canAdmin}
                    placeholder="Ex.: Associação Bíblica Pregue a Palavra"
                    {...register("legalName")}
                  />

                  <FieldError message={errors.legalName?.message} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <div className="space-y-2">
                  <Label htmlFor="organizationCnpj">CNPJ</Label>

                  <Input
                    id="organizationCnpj"
                    disabled={!canAdmin}
                    inputMode="numeric"
                    placeholder="00.000.000/0000-00"
                    {...register("cnpj", {
                      onChange: (event) => {
                        event.target.value = formatCnpj(
                          event.target.value,
                        )
                      },
                    })}
                  />

                  <FieldError message={errors.cnpj?.message} />
                </div>

                <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">
                    Uso do nome
                  </p>

                  <p className="mt-1">
                    O nome de exibição aparece na sidebar e na header. A razão
                    social e o CNPJ serão usados em relatórios, capa e rodapé
                    do Dossiê.
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-4 rounded-xl border p-4">
              <SectionHeading
                icon={<Mail className="size-4" />}
                title="Contato"
                description="Informações institucionais para identificação nos documentos emitidos."
              />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="organizationContactEmail">E-mail</Label>

                  <Input
                    id="organizationContactEmail"
                    type="email"
                    disabled={!canAdmin}
                    placeholder="administrativo@organizacao.com"
                    {...register("contactEmail")}
                  />

                  <FieldError message={errors.contactEmail?.message} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organizationContactPhone">Telefone</Label>

                  <Input
                    id="organizationContactPhone"
                    disabled={!canAdmin}
                    placeholder="(11) 99999-9999"
                    {...register("contactPhone")}
                  />

                  <FieldError message={errors.contactPhone?.message} />
                </div>
              </div>
            </section>

            <section className="space-y-4 rounded-xl border p-4">
              <SectionHeading
                icon={<MapPin className="size-4" />}
                title="Endereço"
                description="O endereço poderá aparecer na capa e no rodapé de relatórios formais."
              />

              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_140px]">
                <div className="space-y-2">
                  <Label htmlFor="organizationAddressLine">Logradouro</Label>

                  <Input
                    id="organizationAddressLine"
                    disabled={!canAdmin}
                    placeholder="Ex.: Rua Santo Rosa"
                    {...register("addressLine")}
                  />

                  <FieldError message={errors.addressLine?.message} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organizationAddressNumber">Número</Label>

                  <Input
                    id="organizationAddressNumber"
                    disabled={!canAdmin}
                    placeholder="96"
                    {...register("addressNumber")}
                  />

                  <FieldError message={errors.addressNumber?.message} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="organizationAddressComplement">
                    Complemento
                  </Label>

                  <Input
                    id="organizationAddressComplement"
                    disabled={!canAdmin}
                    placeholder="Ex.: Sala 408"
                    {...register("addressComplement")}
                  />

                  <FieldError
                    message={errors.addressComplement?.message}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organizationNeighborhood">Bairro</Label>

                  <Input
                    id="organizationNeighborhood"
                    disabled={!canAdmin}
                    placeholder="Ex.: Jardim Alvinópolis"
                    {...register("neighborhood")}
                  />

                  <FieldError message={errors.neighborhood?.message} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_100px_160px]">
                <div className="space-y-2">
                  <Label htmlFor="organizationCity">Cidade</Label>

                  <Input
                    id="organizationCity"
                    disabled={!canAdmin}
                    placeholder="Ex.: Atibaia"
                    {...register("city")}
                  />

                  <FieldError message={errors.city?.message} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organizationState">UF</Label>

                  <Input
                    id="organizationState"
                    disabled={!canAdmin}
                    maxLength={2}
                    placeholder="SP"
                    {...register("state", {
                      onChange: (event) => {
                        event.target.value =
                          event.target.value.toUpperCase()
                      },
                    })}
                  />

                  <FieldError message={errors.state?.message} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organizationZipCode">CEP</Label>

                  <Input
                    id="organizationZipCode"
                    disabled={!canAdmin}
                    inputMode="numeric"
                    placeholder="00000-000"
                    {...register("zipCode", {
                      onChange: (event) => {
                        event.target.value = formatZipCode(
                          event.target.value,
                        )
                      },
                    })}
                  />

                  <FieldError message={errors.zipCode?.message} />
                </div>
              </div>
            </section>

            <section className="space-y-4 rounded-xl border p-4">
              <SectionHeading
                icon={<ShieldCheck className="size-4" />}
                title="Responsáveis pelo fechamento"
                description="Esses dados serão usados para preencher a página final de conferência do Dossiê."
              />

              <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
                Esta área não representa uma assinatura digital. Ela apenas
                define os nomes e cargos que aparecerão na conferência do
                documento.
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="organizationReviewerName">
                    Nome do conferente
                  </Label>

                  <Input
                    id="organizationReviewerName"
                    disabled={!canAdmin}
                    placeholder="Ex.: João da Silva"
                    {...register("reviewerName")}
                  />

                  <FieldError message={errors.reviewerName?.message} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organizationReviewerTitle">
                    Cargo do conferente
                  </Label>

                  <Input
                    id="organizationReviewerTitle"
                    disabled={!canAdmin}
                    placeholder="Ex.: Tesoureiro"
                    {...register("reviewerTitle")}
                  />

                  <FieldError message={errors.reviewerTitle?.message} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organizationApproverName">
                    Nome do aprovador
                  </Label>

                  <Input
                    id="organizationApproverName"
                    disabled={!canAdmin}
                    placeholder="Ex.: Maria da Silva"
                    {...register("approverName")}
                  />

                  <FieldError message={errors.approverName?.message} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organizationApproverTitle">
                    Cargo do aprovador
                  </Label>

                  <Input
                    id="organizationApproverTitle"
                    disabled={!canAdmin}
                    placeholder="Ex.: Diretora administrativa"
                    {...register("approverTitle")}
                  />

                  <FieldError message={errors.approverTitle?.message} />
                </div>
              </div>
            </section>

            <div className="flex flex-col gap-3 border-t pt-4 md:flex-row md:items-center md:justify-between">
              {!canAdmin ? (
                <Badge variant="outline">
                  Somente OWNER/ADMIN podem editar
                </Badge>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Para remover uma informação, deixe o campo vazio e salve.
                </p>
              )}

              {canAdmin && (
                <Button
                  type="submit"
                  disabled={
                    !isDirty ||
                    updateOrganizationProfileMutation.isPending
                  }
                >
                  <Save className="mr-2 size-4" />

                  {updateOrganizationProfileMutation.isPending
                    ? "Salvando..."
                    : "Salvar perfil"}
                </Button>
              )}
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}

type SectionHeadingProps = {
  icon: ReactNode
  title: string
  description: string
}

function SectionHeading({
  icon,
  title,
  description,
}: SectionHeadingProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-lg bg-primary/10 p-2 text-primary">
        {icon}
      </div>

      <div>
        <h3 className="text-sm font-semibold">{title}</h3>

        <p className="mt-1 text-sm text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  )
}

function FieldError({
  message,
}: {
  message?: string
}) {
  if (!message) {
    return null
  }

  return <p className="text-sm text-destructive">{message}</p>
}

function getFormValues(
  organization: OrganizationProfile,
): UpdateOrganizationProfileFormInput {
  return {
    name: organization.name,
    legalName: organization.legalName ?? "",
    cnpj: formatCnpj(organization.cnpj ?? ""),

    contactEmail: organization.contactEmail ?? "",
    contactPhone: organization.contactPhone ?? "",

    addressLine: organization.addressLine ?? "",
    addressNumber: organization.addressNumber ?? "",
    addressComplement: organization.addressComplement ?? "",
    neighborhood: organization.neighborhood ?? "",
    city: organization.city ?? "",
    state: organization.state ?? "",
    zipCode: formatZipCode(organization.zipCode ?? ""),

    reviewerName: organization.reviewerName ?? "",
    reviewerTitle: organization.reviewerTitle ?? "",
    approverName: organization.approverName ?? "",
    approverTitle: organization.approverTitle ?? "",
  }
}

function OrganizationProfileSkeleton() {
  return (
    <div className="space-y-5">
      <div className="rounded-xl border p-4">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="mt-3 h-32 w-full" />
      </div>

      <div className="rounded-xl border p-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-3 h-10 w-full" />
        <Skeleton className="mt-3 h-10 w-full" />
      </div>

      <div className="rounded-xl border p-4">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="mt-3 h-10 w-full" />
        <Skeleton className="mt-3 h-10 w-full" />
      </div>
    </div>
  )
}