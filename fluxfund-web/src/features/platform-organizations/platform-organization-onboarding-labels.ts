import type { PlatformOrganizationOnboardingStatus } from "./platform-organization-onboarding-types"

export const platformOrganizationOnboardingStatusLabels: Record<
  PlatformOrganizationOnboardingStatus,
  string
> = {
  PREPARING: "Em preparação",
  WAITING_CUSTOMER: "Aguardando cliente",
  ONBOARDING: "Em implantação",
  READY_FOR_LAUNCH: "Pronta para lançamento",
  LIVE: "Em produção",
  CANCELED: "Cancelada",
}

export const platformOrganizationOnboardingStatusClassNames: Record<
  PlatformOrganizationOnboardingStatus,
  string
> = {
  PREPARING:
    "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300",

  WAITING_CUSTOMER:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",

  ONBOARDING:
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300",

  READY_FOR_LAUNCH:
    "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-300",

  LIVE:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",

  CANCELED:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300",
}