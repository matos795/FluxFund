import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  RefreshCw,
  ShieldCheck,
} from "lucide-react"

import { AppDialogSection } from "@/components/layout/app-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import type {
  PlatformOrganizationOnboardingReadiness,
  PlatformOrganizationOnboardingRequirement,
} from "../platform-organization-onboarding-types"

type RequirementCardProps = {
  requirement:
    PlatformOrganizationOnboardingRequirement
}

function RequirementCard({
  requirement,
}: RequirementCardProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border p-3",

        requirement.completed
          ? "border-emerald-200 bg-emerald-50/40 dark:border-emerald-900 dark:bg-emerald-950/20"
          : "border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20",
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
  )
}

type PlatformOrganizationOnboardingReadinessSectionProps = {
  readiness:
    PlatformOrganizationOnboardingReadiness

  isRefreshing: boolean
  onRefresh: () => void
}

export function PlatformOrganizationOnboardingReadinessSection({
  readiness,
  isRefreshing,
  onRefresh,
}: PlatformOrganizationOnboardingReadinessSectionProps) {
  const pendingRequirements =
    readiness.requirements.filter(
      (requirement) =>
        !requirement.completed,
    )

  const completedRequirements =
    readiness.requirements.filter(
      (requirement) =>
        requirement.completed,
    )

  const percentage =
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

  return (
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
          "rounded-xl border p-4",

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
                : `${pendingRequirements.length} requisito(s) automático(s) pendente(s).`}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              {
                readiness.completedBlockingRequirements
              }{" "}
              de{" "}
              {
                readiness.totalBlockingRequirements
              }{" "}
              verificações concluídas.
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
                  width: `${percentage}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {pendingRequirements.length >
        0 && (
        <div className="mt-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Atenção necessária
          </p>

          <div className="grid gap-3 lg:grid-cols-2">
            {pendingRequirements.map(
              (requirement) => (
                <RequirementCard
                  key={
                    requirement.key
                  }
                  requirement={
                    requirement
                  }
                />
              ),
            )}
          </div>
        </div>
      )}

      {completedRequirements.length >
        0 && (
        <details className="group mt-4 rounded-xl border bg-muted/20">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium">
            <span>
              Ver{" "}
              {
                completedRequirements.length
              }{" "}
              requisito(s) concluído(s)
            </span>

            <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
          </summary>

          <div className="grid gap-3 border-t p-4 lg:grid-cols-2">
            {completedRequirements.map(
              (requirement) => (
                <RequirementCard
                  key={
                    requirement.key
                  }
                  requirement={
                    requirement
                  }
                />
              ),
            )}
          </div>
        </details>
      )}
    </AppDialogSection>
  )
}