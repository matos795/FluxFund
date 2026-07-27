import {
  ArrowRight,
  CheckCircle2,
  MoreHorizontal,
  Rocket,
} from "lucide-react"

import { AppDialogSection } from "@/components/layout/app-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

import {
  platformOrganizationOnboardingStatusClassNames,
  platformOrganizationOnboardingStatusLabels,
} from "../platform-organization-onboarding-labels"
import type { PlatformOrganizationOnboardingStatus } from "../platform-organization-onboarding-types"

type AlternativeStatusOption = {
  status: PlatformOrganizationOnboardingStatus
  label: string
  destructive?: boolean
}

const alternativeStatusOptions: Record<
  PlatformOrganizationOnboardingStatus,
  AlternativeStatusOption[]
> = {
  PREPARING: [
    {
      status: "WAITING_CUSTOMER",
      label: "Marcar como aguardando cliente",
    },
    {
      status: "CANCELED",
      label: "Cancelar implantação",
      destructive: true,
    },
  ],

  WAITING_CUSTOMER: [
    {
      status: "PREPARING",
      label: "Voltar para preparação",
    },
    {
      status: "CANCELED",
      label: "Cancelar implantação",
      destructive: true,
    },
  ],

  ONBOARDING: [
    {
      status: "WAITING_CUSTOMER",
      label: "Marcar como aguardando cliente",
    },
    {
      status: "PREPARING",
      label: "Voltar para preparação",
    },
    {
      status: "CANCELED",
      label: "Cancelar implantação",
      destructive: true,
    },
  ],

  READY_FOR_LAUNCH: [
    {
      status: "ONBOARDING",
      label: "Retornar para implantação",
    },
    {
      status: "WAITING_CUSTOMER",
      label: "Marcar como aguardando cliente",
    },
    {
      status: "CANCELED",
      label: "Cancelar implantação",
      destructive: true,
    },
  ],

  LIVE: [
    {
      status: "READY_FOR_LAUNCH",
      label: "Retirar de produção",
    },
    {
      status: "ONBOARDING",
      label: "Retornar para implantação",
    },
  ],

  CANCELED: [],
}

export type PlatformOrganizationOnboardingPrimaryAction = {
  targetStatus: PlatformOrganizationOnboardingStatus
  label: string
  description: string
  disabledReason?: string | null
}

type PlatformOrganizationOnboardingStageCardProps = {
  currentStatus: PlatformOrganizationOnboardingStatus

  automaticCompleted: number
  automaticTotal: number

  manualCompleted: number
  manualTotal: number

  primaryAction:
    PlatformOrganizationOnboardingPrimaryAction | null

  isPending: boolean

  onAdvance: (
    status: PlatformOrganizationOnboardingStatus,
  ) => void

  onRequestAlternativeStatus: (
    status: PlatformOrganizationOnboardingStatus,
  ) => void
}

export function PlatformOrganizationOnboardingStageCard({
  currentStatus,
  automaticCompleted,
  automaticTotal,
  manualCompleted,
  manualTotal,
  primaryAction,
  isPending,
  onAdvance,
  onRequestAlternativeStatus,
}: PlatformOrganizationOnboardingStageCardProps) {
  const alternatives =
    alternativeStatusOptions[
      currentStatus
    ]

  const isLive =
    currentStatus === "LIVE"

  return (
    <AppDialogSection
      title="Etapa da implantação"
      description="Avance o cliente conforme as etapas forem concluídas."
      action={
        <Badge
          variant="outline"
          className={
            platformOrganizationOnboardingStatusClassNames[
              currentStatus
            ]
          }
        >
          {
            platformOrganizationOnboardingStatusLabels[
              currentStatus
            ]
          }
        </Badge>
      }
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              {automaticCompleted} de{" "}
              {automaticTotal} automáticos
            </Badge>

            <Badge variant="secondary">
              {manualCompleted} de{" "}
              {manualTotal} manuais
            </Badge>
          </div>

          {primaryAction && (
            <div className="mt-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Próxima etapa
              </p>

              <p className="mt-1 text-sm font-medium">
                {primaryAction.label}
              </p>

              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {
                  primaryAction.description
                }
              </p>
            </div>
          )}

          {isLive && (
            <div className="mt-3 flex items-start gap-2 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />

              <div>
                <p className="text-sm font-medium">
                  Organização em produção
                </p>

                <p className="mt-1 text-xs">
                  O cliente já concluiu o fluxo principal de implantação.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          {primaryAction && (
            <Button
              type="button"
              disabled={
                isPending ||
                Boolean(
                  primaryAction.disabledReason,
                )
              }
              onClick={() =>
                onAdvance(
                  primaryAction.targetStatus,
                )
              }
            >
              {primaryAction.targetStatus ===
              "LIVE" ? (
                <Rocket className="mr-2 size-4" />
              ) : (
                <ArrowRight className="mr-2 size-4" />
              )}

              {primaryAction.label}
            </Button>
          )}

          {alternatives.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger
                asChild
              >
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                >
                  <MoreHorizontal className="mr-2 size-4" />
                  Mais opções
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="min-w-64"
              >
                {alternatives.map(
                  (option) => (
                    <DropdownMenuItem
                      key={
                        option.status
                      }
                      className={cn(
                        option.destructive &&
                          "text-destructive focus:text-destructive",
                      )}
                      onClick={() =>
                        onRequestAlternativeStatus(
                          option.status,
                        )
                      }
                    >
                      {option.label}
                    </DropdownMenuItem>
                  ),
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {primaryAction?.disabledReason && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950/30">
          <p className="font-medium text-amber-800 dark:text-amber-300">
            A próxima etapa ainda está bloqueada.
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            {
              primaryAction.disabledReason
            }
          </p>
        </div>
      )}
    </AppDialogSection>
  )
}