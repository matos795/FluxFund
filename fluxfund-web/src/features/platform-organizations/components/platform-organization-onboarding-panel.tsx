import { zodResolver } from "@hookform/resolvers/zod"
import {
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
  RefreshCw,
  Rocket,
  Save,
  ShieldCheck,
} from "lucide-react"
import {
  Controller,
  useForm,
  useWatch,
} from "react-hook-form"
import { toast } from "sonner"

import { CurrencyInput } from "@/components/form/currency-input"
import {
  AppDialogSection,
  AppDialogStatCard,
} from "@/components/layout/app-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { getApiErrorMessage } from "@/utils/api-error"

import { usePlatformOrganizationOnboarding } from "../hooks/use-platform-organization-onboarding"
import { useUpdatePlatformOrganizationOnboarding } from "../hooks/use-update-platform-organization-onboarding"
import {
  platformOrganizationOnboardingStatusClassNames,
  platformOrganizationOnboardingStatusLabels,
} from "../platform-organization-onboarding-labels"
import {
  platformOrganizationOnboardingSchema,
  type PlatformOrganizationOnboardingFormData,
  type PlatformOrganizationOnboardingFormInput,
} from "../platform-organization-onboarding-schema"
import {
  platformOrganizationOnboardingStatuses,
  type PlatformOrganizationOnboarding,
  type PlatformOrganizationOnboardingReadiness,
  type UpdatePlatformOrganizationOnboardingRequest,
} from "../platform-organization-onboarding-types"

type PlatformOrganizationOnboardingPanelProps = {
  organizationId: string
  enabled: boolean
}

type ManualChecklistField =
  | "contractSigned"
  | "categoriesReviewed"
  | "documentationRulesReviewed"
  | "initialImportValidated"
  | "testReportValidated"
  | "usersTrained"
  | "initialBackupConfirmed"

const manualChecklistItems: Array<{
  name: ManualChecklistField
  title: string
  description: string
}> = [
  {
    name: "contractSigned",
    title: "Contrato assinado",
    description:
      "O contrato comercial foi revisado e formalizado.",
  },
  {
    name: "categoriesReviewed",
    title: "Categorias revisadas",
    description:
      "O plano de categorias foi validado com o cliente.",
  },
  {
    name:
      "documentationRulesReviewed",
    title:
      "Políticas documentais revisadas",
    description:
      "As regras de comprovantes, notas e recibos foram conferidas.",
  },
  {
    name:
      "initialImportValidated",
    title:
      "Importação inicial validada",
    description:
      "Uma importação inicial foi realizada e conferida.",
  },
  {
    name: "testReportValidated",
    title:
      "Relatório de teste validado",
    description:
      "Os relatórios foram comparados com os dados reais.",
  },
  {
    name: "usersTrained",
    title: "Usuários treinados",
    description:
      "Os responsáveis receberam orientação para operar o sistema.",
  },
  {
    name:
      "initialBackupConfirmed",
    title:
      "Backup inicial confirmado",
    description:
      "O primeiro backup e a estratégia de recuperação foram verificados.",
  },
]

function normalizeNullable(
  value: string,
) {
  const normalized =
    value.trim()

  return normalized || null
}

function formatDateTime(
  value: string | null,
) {
  if (!value) {
    return "Ainda não"
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle: "short",
      timeStyle: "short",
    },
  ).format(new Date(value))
}

type PlatformOrganizationOnboardingFormProps = {
  organizationId: string
  onboarding: PlatformOrganizationOnboarding
  readiness: PlatformOrganizationOnboardingReadiness
  isRefreshing: boolean
  onRefresh: () => void
}

function PlatformOrganizationOnboardingForm({
  organizationId,
  onboarding,
  readiness,
  isRefreshing,
  onRefresh,
}: PlatformOrganizationOnboardingFormProps) {
  const updateMutation =
    useUpdatePlatformOrganizationOnboarding()

  const {
    register,
    control,
    handleSubmit,
    formState: {
      errors,
    },
  } = useForm<
    PlatformOrganizationOnboardingFormInput,
    unknown,
    PlatformOrganizationOnboardingFormData
  >({
    resolver: zodResolver(
      platformOrganizationOnboardingSchema,
    ),

    defaultValues: {
      status:
        onboarding.status,

      planName:
        onboarding.planName ?? "",

      monthlyFee:
        onboarding.monthlyFee ??
        undefined,

      setupFee:
        onboarding.setupFee ??
        undefined,

      contractStartDate:
        onboarding.contractStartDate ??
        "",

      billingDueDay:
        onboarding.billingDueDay ??
        undefined,

      contractSigned:
        onboarding.contractSigned,

      categoriesReviewed:
        onboarding.categoriesReviewed,

      documentationRulesReviewed:
        onboarding.documentationRulesReviewed,

      initialImportValidated:
        onboarding.initialImportValidated,

      testReportValidated:
        onboarding.testReportValidated,

      usersTrained:
        onboarding.usersTrained,

      initialBackupConfirmed:
        onboarding.initialBackupConfirmed,

      goLiveApproved:
        onboarding.goLiveApproved,

      internalNotes:
        onboarding.internalNotes ??
        "",
    },
  })

  const selectedStatus =
    useWatch({
      control,
      name: "status",
    }) ?? onboarding.status

  const readinessPercentage =
    readiness.totalBlockingRequirements ===
    0
      ? 0
      : Math.round(
          (
            readiness.completedBlockingRequirements /
            readiness.totalBlockingRequirements
          ) *
            100,
        )

  /*
   * READY_FOR_LAUNCH sempre precisa
   * estar automaticamente pronto.
   *
   * LIVE também precisa, exceto quando
   * a organização já estava LIVE.
   * Isso espelha a regra do backend.
   */
  const requiresAutomaticReadiness =
    selectedStatus ===
      "READY_FOR_LAUNCH" ||
    (
      selectedStatus === "LIVE" &&
      onboarding.status !== "LIVE"
    )

  const automaticReadinessBlocked =
    requiresAutomaticReadiness &&
    !readiness.readyForLaunch

  function handleSave(
    data: PlatformOrganizationOnboardingFormData,
  ) {
    if (
      automaticReadinessBlocked
    ) {
      toast.error(
        "Existem requisitos automáticos pendentes para este status.",
      )

      return
    }

    const request: UpdatePlatformOrganizationOnboardingRequest =
      {
        status: data.status,

        planName:
          normalizeNullable(
            data.planName,
          ),

        monthlyFee:
          data.monthlyFee ??
          null,

        setupFee:
          data.setupFee ??
          null,

        contractStartDate:
          data.contractStartDate ||
          null,

        billingDueDay:
          data.billingDueDay ??
          null,

        contractSigned:
          data.contractSigned,

        categoriesReviewed:
          data.categoriesReviewed,

        documentationRulesReviewed:
          data.documentationRulesReviewed,

        initialImportValidated:
          data.initialImportValidated,

        testReportValidated:
          data.testReportValidated,

        usersTrained:
          data.usersTrained,

        initialBackupConfirmed:
          data.initialBackupConfirmed,

        goLiveApproved:
          data.goLiveApproved,

        internalNotes:
          normalizeNullable(
            data.internalNotes,
          ),
      }

    updateMutation.mutate(
      {
        organizationId,
        data: request,
      },
      {
        onSuccess: () => {
          toast.success(
            "Implantação atualizada com sucesso.",
          )
        },

        onError: (error) => {
          toast.error(
            getApiErrorMessage(
              error,
              "Não foi possível atualizar a implantação.",
            ),
          )
        },
      },
    )
  }

  return (
    <form
      className="space-y-5"
      onSubmit={handleSubmit(
        handleSave,
      )}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AppDialogStatCard
          label="Status da implantação"
          value={
            <Badge
              variant="outline"
              className={
                platformOrganizationOnboardingStatusClassNames[
                  onboarding.status
                ]
              }
            >
              {
                platformOrganizationOnboardingStatusLabels[
                  onboarding.status
                ]
              }
            </Badge>
          }
        />

        <AppDialogStatCard
          label="Prontidão automática"
          value={`${readiness.completedBlockingRequirements} de ${readiness.totalBlockingRequirements}`}
          description={`${readinessPercentage}% concluído`}
        />

        <AppDialogStatCard
          label="Plano atual"
          value={
            onboarding.planName ??
            "Não definido"
          }
        />

        <AppDialogStatCard
          label="Entrada em produção"
          value={formatDateTime(
            onboarding.launchedAt,
          )}
        />
      </div>

      <AppDialogSection
        title="Prontidão automática"
        description="Verificações calculadas com base nos dados reais da organização."
        action={
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isRefreshing}
            onClick={onRefresh}
          >
            <RefreshCw
              className={cn(
                "mr-2 size-4",
                isRefreshing &&
                  "animate-spin",
              )}
            />

            Reavaliar
          </Button>
        }
      >
        <div
          className={cn(
            "mb-4 rounded-xl border p-4",

            readiness.readyForLaunch
              ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/30"
              : "border-amber-200 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/30",
          )}
        >
          <div className="flex items-start gap-3">
            {readiness.readyForLaunch ? (
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="mt-0.5 size-5 shrink-0 text-amber-600" />
            )}

            <div className="min-w-0 flex-1">
              <p className="font-medium">
                {readiness.readyForLaunch
                  ? "A organização atende aos requisitos automáticos."
                  : "Ainda existem requisitos automáticos pendentes."}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                {readiness.completedBlockingRequirements} de{" "}
                {readiness.totalBlockingRequirements} verificações concluídas.
              </p>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-background/80">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",

                    readiness.readyForLaunch
                      ? "bg-emerald-500"
                      : "bg-amber-500",
                  )}
                  style={{
                    width: `${readinessPercentage}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          {readiness.requirements.map(
            (requirement) => (
              <div
                key={requirement.key}
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-3",

                  requirement.completed
                    ? "border-emerald-200 bg-emerald-50/40 dark:border-emerald-900 dark:bg-emerald-950/20"
                    : "border-amber-200 bg-amber-50/40 dark:border-amber-900 dark:bg-amber-950/20",
                )}
              >
                {requirement.completed ? (
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="mt-0.5 size-5 shrink-0 text-amber-600" />
                )}

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">
                      {requirement.title}
                    </p>

                    {requirement.blocking && (
                      <Badge
                        variant="outline"
                        className="text-[10px]"
                      >
                        Obrigatório
                      </Badge>
                    )}
                  </div>

                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {requirement.detail}
                  </p>
                </div>
              </div>
            ),
          )}
        </div>
      </AppDialogSection>

      <AppDialogSection
        title="Configuração comercial"
        description="Plano, valores e condições combinadas com o cliente."
        action={
          <ClipboardCheck className="size-4 text-muted-foreground" />
        }
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="onboarding-status">
              Status
            </Label>

            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={
                    field.onChange
                  }
                >
                  <SelectTrigger
                    id="onboarding-status"
                    className="w-full"
                  >
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    {platformOrganizationOnboardingStatuses.map(
                      (status) => (
                        <SelectItem
                          key={status}
                          value={status}
                        >
                          {
                            platformOrganizationOnboardingStatusLabels[
                              status
                            ]
                          }
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              )}
            />

            {errors.status && (
              <p className="text-xs text-destructive">
                {errors.status.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="planName">
              Plano
            </Label>

            <Input
              id="planName"
              placeholder="Ex: Plano Essencial"
              {...register(
                "planName",
              )}
            />

            {errors.planName && (
              <p className="text-xs text-destructive">
                {
                  errors.planName
                    .message
                }
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="billingDueDay">
              Dia de vencimento
            </Label>

            <Controller
              name="billingDueDay"
              control={control}
              render={({ field }) => (
                <Input
                  id="billingDueDay"
                  type="number"
                  min={1}
                  max={28}
                  placeholder="Ex: 10"
                  value={
                    field.value ??
                    ""
                  }
                  onChange={(
                    event,
                  ) => {
                    const value =
                      event.target
                        .value

                    field.onChange(
                      value
                        ? Number(value)
                        : undefined,
                    )
                  }}
                />
              )}
            />

            {errors.billingDueDay && (
              <p className="text-xs text-destructive">
                {
                  errors
                    .billingDueDay
                    .message
                }
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="monthlyFee">
              Mensalidade
            </Label>

            <Controller
              name="monthlyFee"
              control={control}
              render={({ field }) => (
                <CurrencyInput
                  id="monthlyFee"
                  value={
                    field.value
                  }
                  allowEmpty
                  onValueChange={
                    field.onChange
                  }
                />
              )}
            />

            {errors.monthlyFee && (
              <p className="text-xs text-destructive">
                {
                  errors.monthlyFee
                    .message
                }
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="setupFee">
              Taxa de implantação
            </Label>

            <Controller
              name="setupFee"
              control={control}
              render={({ field }) => (
                <CurrencyInput
                  id="setupFee"
                  value={
                    field.value
                  }
                  allowEmpty
                  onValueChange={
                    field.onChange
                  }
                />
              )}
            />

            {errors.setupFee && (
              <p className="text-xs text-destructive">
                {
                  errors.setupFee
                    .message
                }
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contractStartDate">
              Início do contrato
            </Label>

            <Input
              id="contractStartDate"
              type="date"
              {...register(
                "contractStartDate",
              )}
            />

            {errors.contractStartDate && (
              <p className="text-xs text-destructive">
                {
                  errors
                    .contractStartDate
                    .message
                }
              </p>
            )}
          </div>
        </div>
      </AppDialogSection>

      <AppDialogSection
        title="Checklist manual"
        description="Etapas que dependem de conferência ou confirmação humana."
      >
        <div className="grid gap-3 lg:grid-cols-2">
          {manualChecklistItems.map(
            (item) => (
              <div
                key={item.name}
                className="rounded-xl border p-3"
              >
                <div className="flex items-start gap-3">
                  <Controller
                    name={item.name}
                    control={control}
                    render={({
                      field,
                    }) => (
                      <Checkbox
                        id={`onboarding-${item.name}`}
                        className="mt-0.5"
                        checked={
                          field.value
                        }
                        onCheckedChange={(
                          checked,
                        ) =>
                          field.onChange(
                            checked ===
                              true,
                          )
                        }
                      />
                    )}
                  />

                  <div>
                    <Label
                      htmlFor={`onboarding-${item.name}`}
                      className="cursor-pointer"
                    >
                      {item.title}
                    </Label>

                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {
                        item.description
                      }
                    </p>

                    {errors[
                      item.name
                    ] && (
                      <p className="mt-1 text-xs text-destructive">
                        {
                          errors[
                            item.name
                          ]?.message
                        }
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ),
          )}
        </div>
      </AppDialogSection>

      <AppDialogSection
        title="Entrada em produção"
        description="Aprovação administrativa final para liberar a operação oficial."
        action={
          <Rocket className="size-4 text-muted-foreground" />
        }
      >
        <div
          className={cn(
            "rounded-xl border p-4",

            selectedStatus === "LIVE"
              ? "border-emerald-200 bg-emerald-50/40 dark:border-emerald-900 dark:bg-emerald-950/20"
              : "bg-muted/20",
          )}
        >
          <div className="flex items-start gap-3">
            <Controller
              name="goLiveApproved"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="goLiveApproved"
                  className="mt-0.5"
                  checked={
                    field.value
                  }
                  onCheckedChange={(
                    checked,
                  ) =>
                    field.onChange(
                      checked === true,
                    )
                  }
                />
              )}
            />

            <div>
              <Label
                htmlFor="goLiveApproved"
                className="cursor-pointer"
              >
                Aprovar entrada em produção
              </Label>

              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Confirma que o cliente pode iniciar o uso oficial do FluxFund.
              </p>

              {errors.goLiveApproved && (
                <p className="mt-1 text-xs text-destructive">
                  {
                    errors
                      .goLiveApproved
                      .message
                  }
                </p>
              )}
            </div>
          </div>
        </div>
      </AppDialogSection>

      <AppDialogSection
        title="Observações internas"
        description="Anotações visíveis apenas no backoffice administrativo."
      >
        <Textarea
          rows={6}
          placeholder="Ex: Cliente aguardando envio dos saldos iniciais..."
          {...register(
            "internalNotes",
          )}
        />

        {errors.internalNotes && (
          <p className="mt-2 text-xs text-destructive">
            {
              errors.internalNotes
                .message
            }
          </p>
        )}
      </AppDialogSection>

      {automaticReadinessBlocked && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-amber-600" />

          <div>
            <p className="text-sm font-medium">
              Não é possível avançar para este status.
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Conclua os requisitos automáticos pendentes e use o botão Reavaliar.
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={
            updateMutation.isPending ||
            automaticReadinessBlocked
          }
        >
          <Save className="mr-2 size-4" />

          {updateMutation.isPending
            ? "Salvando..."
            : "Salvar implantação"}
        </Button>
      </div>
    </form>
  )
}

export function PlatformOrganizationOnboardingPanel({
  organizationId,
  enabled,
}: PlatformOrganizationOnboardingPanelProps) {
  const onboardingQuery =
    usePlatformOrganizationOnboarding(
      organizationId,
      enabled,
    )

  if (
    onboardingQuery.isLoading
  ) {
    return (
      <div className="rounded-xl border p-6 text-sm text-muted-foreground">
        Carregando informações da implantação...
      </div>
    )
  }

  if (
    onboardingQuery.isError ||
    !onboardingQuery.data
  ) {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-5">
        <p className="text-sm font-medium text-destructive">
          Não foi possível carregar a implantação.
        </p>

        <p className="mt-1 text-xs text-muted-foreground">
          {getApiErrorMessage(
            onboardingQuery.error,
            "Verifique a conexão com a API.",
          )}
        </p>

        <Button
          type="button"
          size="sm"
          variant="outline"
          className="mt-4"
          onClick={() =>
            void onboardingQuery.refetch()
          }
        >
          Tentar novamente
        </Button>
      </div>
    )
  }

  const {
    onboarding,
    readiness,
  } = onboardingQuery.data

  return (
    <PlatformOrganizationOnboardingForm
      /*
       * O updatedAt muda após salvar.
       * A nova key recria o formulário
       * com os dados retornados pela API.
       */
      key={
        onboarding.updatedAt ??
        onboarding.id
      }
      organizationId={
        organizationId
      }
      onboarding={onboarding}
      readiness={readiness}
      isRefreshing={
        onboardingQuery.isFetching
      }
      onRefresh={() =>
        void onboardingQuery.refetch()
      }
    />
  )
}