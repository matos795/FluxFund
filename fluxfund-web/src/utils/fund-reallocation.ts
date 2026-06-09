import type { FinancialTransactionType } from "@/features/financial-transactions/financial-transaction-types"
import type { FundOption } from "@/features/funds/fund-types"
import type { OrganizationSettings } from "@/features/organization-settings/organization-settings-types"

type ReallocationSuggestionInput = {
  fundId: string
  amount: number
  transactionType: FinancialTransactionType
  funds: FundOption[]
  settings: OrganizationSettings | undefined
}

export function getDefaultFundReallocationSuggestion({
  fundId,
  amount,
  transactionType,
  funds,
  settings,
}: ReallocationSuggestionInput) {
  if (!settings) {
    return null
  }

  if (transactionType !== "EXPENSE") {
    return null
  }

  if (settings.allowNegativeFunds) {
    return null
  }

  if (!settings.suggestDefaultFundReallocation) {
    return null
  }

  const defaultFundId = settings.defaultFund?.id

  if (!defaultFundId) {
    return null
  }

  if (!fundId || fundId === defaultFundId) {
    return null
  }

  if (!amount || amount <= 0) {
    return null
  }

  const selectedFund = funds.find((fund) => fund.id === fundId)
  const defaultFund = funds.find((fund) => fund.id === defaultFundId)

  if (!selectedFund || !defaultFund) {
    return null
  }

  const available = Math.max(selectedFund.currentBalance, 0)

  if (amount <= available) {
    return null
  }

  if (available <= 0) {
    return {
      selectedFund,
      defaultFund,
      selectedFundAmount: 0,
      defaultFundAmount: amount,
    }
  }

  return {
    selectedFund,
    defaultFund,
    selectedFundAmount: available,
    defaultFundAmount: amount - available,
  }
}