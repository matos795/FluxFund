export const platformOrganizationOnboardingStatuses = [
  "PREPARING",
  "WAITING_CUSTOMER",
  "ONBOARDING",
  "READY_FOR_LAUNCH",
  "LIVE",
  "CANCELED",
] as const

export type PlatformOrganizationOnboardingStatus =
  (typeof platformOrganizationOnboardingStatuses)[number]

export type PlatformOrganizationOnboardingRequirementKey =
  | "ORGANIZATION_ACTIVE"
  | "ACTIVE_OWNER"
  | "MINIMUM_PROFILE"
  | "ACTIVE_OPERATIONAL_ACCOUNT"
  | "ACCOUNT_INITIAL_DATES"
  | "ACTIVE_FUND"
  | "FUND_INITIAL_DATES"
  | "ACTIVE_DEFAULT_FUND"
  | "ACCOUNTABILITY_HISTORY_START_DATE"
  | "ACTIVE_INCOME_CATEGORY"
  | "ACTIVE_EXPENSE_CATEGORY"

export type PlatformOrganizationOnboarding = {
  id: string
  organizationId: string

  status: PlatformOrganizationOnboardingStatus

  planName: string | null
  monthlyFee: number | null
  setupFee: number | null
  contractStartDate: string | null
  billingDueDay: number | null

  contractSigned: boolean
  categoriesReviewed: boolean
  documentationRulesReviewed: boolean
  initialImportValidated: boolean
  testReportValidated: boolean
  usersTrained: boolean
  initialBackupConfirmed: boolean
  goLiveApproved: boolean

  internalNotes: string | null
  launchedAt: string | null
  createdAt: string
  updatedAt: string | null
}

export type PlatformOrganizationOnboardingRequirement = {
  key: PlatformOrganizationOnboardingRequirementKey
  title: string
  completed: boolean
  blocking: boolean
  detail: string
}

export type PlatformOrganizationOnboardingReadiness = {
  readyForLaunch: boolean
  completedBlockingRequirements: number
  totalBlockingRequirements: number
  requirements: PlatformOrganizationOnboardingRequirement[]
}

export type PlatformOrganizationOnboardingDetails = {
  onboarding: PlatformOrganizationOnboarding
  readiness: PlatformOrganizationOnboardingReadiness
}

export type UpdatePlatformOrganizationOnboardingRequest = {
  status: PlatformOrganizationOnboardingStatus

  planName: string | null
  monthlyFee: number | null
  setupFee: number | null
  contractStartDate: string | null
  billingDueDay: number | null

  contractSigned: boolean
  categoriesReviewed: boolean
  documentationRulesReviewed: boolean
  initialImportValidated: boolean
  testReportValidated: boolean
  usersTrained: boolean
  initialBackupConfirmed: boolean
  goLiveApproved: boolean

  internalNotes: string | null
}