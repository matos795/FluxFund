import type { FundSummary } from "../funds/fund-types"

export type OrganizationSettings = {
  id: string
  organizationId: string
  defaultFund: FundSummary | null
  allowNegativeFunds: boolean
  suggestDefaultFundReallocation: boolean
  requireFiscalDocumentForExpenses: boolean
  requireProofForIncomes: boolean
  autoFillClassificationSuggestions: boolean
  createdAt: string
  updatedAt: string | null
}

export type UpdateOrganizationSettingsRequest = {
  defaultFundId: string | null
  allowNegativeFunds: boolean
  suggestDefaultFundReallocation: boolean
  requireFiscalDocumentForExpenses: boolean
  requireProofForIncomes: boolean
  autoFillClassificationSuggestions: boolean
}