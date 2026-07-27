import { zodResolver } from "@hookform/resolvers/zod"
import {
    ClipboardCheck,
    Rocket,
    Save,
} from "lucide-react"
import {
    Controller,
    useForm,
    type Path,
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
    type PlatformOrganizationOnboarding,
    type PlatformOrganizationOnboardingReadiness,
    type PlatformOrganizationOnboardingStatus,
    type UpdatePlatformOrganizationOnboardingRequest,
} from "../platform-organization-onboarding-types"
import { PlatformOrganizationOnboardingReadinessSection } from "./platform-organization-onboarding-readiness-section"
import { ConfirmActionDialog } from "@/components/layout/confirm-action-dialog"
import { useState } from "react"
import { PlatformOrganizationOnboardingStageCard, type PlatformOrganizationOnboardingPrimaryAction } from "./platform-organization-onboarding-stage-card"

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

function getPrimaryOnboardingAction(
    status: PlatformOrganizationOnboardingStatus,
): PlatformOrganizationOnboardingPrimaryAction | null {
    switch (status) {
        case "PREPARING":
            return {
                targetStatus: "ONBOARDING",
                label: "Iniciar implantação",
                description:
                    "Registra que a configuração inicial do cliente começou.",
            }

        case "WAITING_CUSTOMER":
            return {
                targetStatus: "ONBOARDING",
                label: "Retomar implantação",
                description:
                    "Continua o processo após a resposta ou entrega do cliente.",
            }

        case "ONBOARDING":
            return {
                targetStatus:
                    "READY_FOR_LAUNCH",

                label:
                    "Marcar como pronta para lançamento",

                description:
                    "Confirma que as configurações e validações foram concluídas.",
            }

        case "READY_FOR_LAUNCH":
            return {
                targetStatus: "LIVE",
                label:
                    "Colocar organização em produção",

                description:
                    "Libera o início oficial da operação do cliente.",
            }

        case "CANCELED":
            return {
                targetStatus: "PREPARING",
                label: "Reabrir implantação",
                description:
                    "Retoma uma implantação anteriormente cancelada.",
            }

        case "LIVE":
            return null
    }
}

function getLocalDateValue() {
    const today =
        new Date()

    const year =
        today.getFullYear()

    const month =
        String(
            today.getMonth() + 1,
        ).padStart(2, "0")

    const day =
        String(
            today.getDate(),
        ).padStart(2, "0")

    return `${year}-${month}-${day}`
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

    const [
        requestedAlternativeStatus,
        setRequestedAlternativeStatus,
    ] =
        useState<PlatformOrganizationOnboardingStatus | null>(
            null,
        )

    const updateMutation =
        useUpdatePlatformOrganizationOnboarding()

    const {
        register,
        control,
        watch,
        getValues,
        setError,
        clearErrors,
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

    const primaryAction =
        getPrimaryOnboardingAction(
            onboarding.status,
        )

    const readinessPercentage =
        readiness.totalBlockingRequirements === 0
            ? 0
            : Math.round(
                (
                    readiness.completedBlockingRequirements /
                    readiness.totalBlockingRequirements
                ) * 100,
            )

    const manualCompletedCount =
        manualChecklistItems.reduce(
            (
                completed,
                item,
            ) =>
                completed +
                (watch(item.name)
                    ? 1
                    : 0),

            0,
        )

    const watchedPlanName =
        watch("planName") ?? ""

    const watchedMonthlyFee =
        watch("monthlyFee")

    const watchedContractStartDate =
        watch("contractStartDate") ??
        ""

    const watchedBillingDueDay =
        watch("billingDueDay")

    const watchedGoLiveApproved =
        watch("goLiveApproved")

    const commercialConfigurationReady =
        Boolean(
            watchedPlanName.trim(),
        ) &&
        watchedMonthlyFee !==
        undefined &&
        Boolean(
            watchedContractStartDate,
        ) &&
        watchedBillingDueDay !==
        undefined &&
        watchedBillingDueDay >= 1 &&
        watchedBillingDueDay <= 28

    function getPrimaryDisabledReason() {
        if (!primaryAction) {
            return null
        }

        const targetStatus =
            primaryAction.targetStatus

        const requiresLaunchReadiness =
            targetStatus ===
            "READY_FOR_LAUNCH" ||
            targetStatus === "LIVE"

        if (!requiresLaunchReadiness) {
            return null
        }

        if (!readiness.readyForLaunch) {
            const pending =
                readiness.totalBlockingRequirements -
                readiness.completedBlockingRequirements

            return `${pending} requisito(s) automático(s) ainda precisa(m) ser concluído(s).`
        }

        if (
            manualCompletedCount <
            manualChecklistItems.length
        ) {
            const pending =
                manualChecklistItems.length -
                manualCompletedCount

            return `${pending} etapa(s) do checklist manual ainda precisa(m) ser concluída(s).`
        }

        if (
            !commercialConfigurationReady
        ) {
            return "Preencha plano, mensalidade, início do contrato e dia de vencimento."
        }

        if (
            targetStatus === "LIVE" &&
            !watchedGoLiveApproved
        ) {
            return "Aprove a entrada em produção na seção correspondente."
        }

        if (
            targetStatus === "LIVE" &&
            watchedContractStartDate >
            getLocalDateValue()
        ) {
            return "A data inicial do contrato não pode estar no futuro."
        }

        return null
    }

    const primaryActionWithReason =
        primaryAction
            ? {
                ...primaryAction,

                disabledReason:
                    getPrimaryDisabledReason(),
            }
            : null

    function submitWithStatus(
        targetStatus: PlatformOrganizationOnboardingStatus,
        successMessage: string,
    ) {
        clearErrors()

        const validation =
            platformOrganizationOnboardingSchema.safeParse(
                {
                    ...getValues(),
                    status: targetStatus,
                },
            )

        if (!validation.success) {
            validation.error.issues.forEach(
                (issue) => {
                    const field =
                        issue.path[0]

                    if (
                        typeof field !== "string"
                    ) {
                        return
                    }

                    setError(
                        field as Path<PlatformOrganizationOnboardingFormInput>,
                        {
                            type: "manual",
                            message:
                                issue.message,
                        },
                    )
                },
            )

            toast.error(
                "Revise os campos destacados antes de continuar.",
            )

            return
        }

        const requiresAutomaticReadiness =
            targetStatus ===
            "READY_FOR_LAUNCH" ||
            targetStatus === "LIVE"

        if (
            requiresAutomaticReadiness &&
            !readiness.readyForLaunch
        ) {
            toast.error(
                "Ainda existem requisitos automáticos pendentes.",
            )

            return
        }

        const data =
            validation.data

        const request: UpdatePlatformOrganizationOnboardingRequest =
        {
            status:
                targetStatus,

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
                        successMessage,
                    )

                    setRequestedAlternativeStatus(
                        null,
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
        <>
            <form
                className="space-y-5"
                onSubmit={(event) => {
                    event.preventDefault()

                    submitWithStatus(
                        onboarding.status,
                        "Alterações salvas com sucesso.",
                    )
                }}
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

                <PlatformOrganizationOnboardingStageCard
                    currentStatus={
                        onboarding.status
                    }
                    automaticCompleted={
                        readiness.completedBlockingRequirements
                    }
                    automaticTotal={
                        readiness.totalBlockingRequirements
                    }
                    manualCompleted={
                        manualCompletedCount
                    }
                    manualTotal={
                        manualChecklistItems.length
                    }
                    primaryAction={
                        primaryActionWithReason
                    }
                    isPending={
                        updateMutation.isPending
                    }
                    onAdvance={(status) =>
                        submitWithStatus(
                            status,

                            status === "LIVE"
                                ? "Organização colocada em produção."
                                : "Etapa da implantação atualizada.",
                        )
                    }
                    onRequestAlternativeStatus={
                        setRequestedAlternativeStatus
                    }
                />

                <PlatformOrganizationOnboardingReadinessSection
                    readiness={readiness}
                    isRefreshing={
                        isRefreshing
                    }
                    onRefresh={onRefresh}
                />

                <AppDialogSection
                    title="Configuração comercial"
                    description="Plano, valores e condições combinadas com o cliente."
                    action={
                        <ClipboardCheck className="size-4 text-muted-foreground" />
                    }
                >
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

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

                            onboarding.status ===
                                "READY_FOR_LAUNCH" ||
                                onboarding.status === "LIVE"
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

                <div className="flex justify-end">
                    <Button
                        type="submit"
                        disabled={
                            updateMutation.isPending
                        }
                    >
                        <Save className="mr-2 size-4" />

                        {updateMutation.isPending
                            ? "Salvando..."
                            : "Salvar alterações"}
                    </Button>
                </div>
            </form>

            <ConfirmActionDialog
                open={
                    requestedAlternativeStatus !==
                    null
                }
                onOpenChange={(
                    nextOpen,
                ) => {
                    if (
                        !nextOpen &&
                        !updateMutation.isPending
                    ) {
                        setRequestedAlternativeStatus(
                            null,
                        )
                    }
                }}
                title="Alterar etapa da implantação?"
                description={
                    <>
                        O status será alterado para{" "}
                        <strong>
                            {requestedAlternativeStatus
                                ? platformOrganizationOnboardingStatusLabels[
                                requestedAlternativeStatus
                                ]
                                : ""}
                        </strong>
                        . Os dados já preenchidos serão
                        preservados.
                    </>
                }
                confirmLabel={
                    requestedAlternativeStatus ===
                        "CANCELED"
                        ? "Cancelar implantação"
                        : "Alterar status"
                }
                pendingLabel="Alterando..."
                isPending={
                    updateMutation.isPending
                }
                isDestructive={
                    requestedAlternativeStatus ===
                    "CANCELED"
                }
                onConfirm={() => {
                    if (
                        !requestedAlternativeStatus
                    ) {
                        return
                    }

                    submitWithStatus(
                        requestedAlternativeStatus,

                        `Status alterado para ${platformOrganizationOnboardingStatusLabels[
                        requestedAlternativeStatus
                        ]
                        }.`,
                    )
                }}
            />
        </>
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