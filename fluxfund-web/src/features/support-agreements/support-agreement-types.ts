import type { BeneficiarySummary } from "@/features/beneficiaries/beneficiary-types"
import type { FundSummary } from "@/features/funds/fund-types"

export type SupportAgreement = {
  id: string
  organizationId: string
  beneficiary: BeneficiarySummary
  fund: FundSummary
  amount: number
  startDate: string
  endDate: string | null
  active: boolean
  description: string | null
  createdAt: string
  updatedAt: string | null
}

export type CreateSupportAgreementRequest = {
  beneficiaryId: string
  fundId: string
  amount: number
  startDate: string
  endDate?: string | null
  description?: string | null
}

export type UpdateSupportAgreementRequest = {
  beneficiaryId: string
  fundId: string
  amount: number
  startDate: string
  endDate?: string | null
  active?: boolean
  description?: string | null
}

export type CreateSupportAgreementVersionRequest = {
  amount: number
  startDate: string
  description?: string | null
}