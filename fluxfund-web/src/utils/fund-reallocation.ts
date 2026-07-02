import type { FinancialTransactionType } from "@/features/financial-transactions/financial-transaction-types"
import type { FundOption } from "@/features/funds/fund-types"
import type { OrganizationSettings } from "@/features/organization-settings/organization-settings-types"
import { formatCents, fromCents } from "./formatters"

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

  const amountInCents = formatCents(amount)

  if (amountInCents <= 0) {
    return null
  }

  const selectedFund = funds.find((fund) => fund.id === fundId)
  const defaultFund = funds.find((fund) => fund.id === defaultFundId)

  if (!selectedFund || !defaultFund) {
    return null
  }

  const availableInCents = Math.max(
    formatCents(selectedFund.currentBalance),
    0,
  )

  if (amountInCents <= availableInCents) {
    return null
  }

  const selectedFundAmountInCents = Math.min(
    amountInCents,
    availableInCents,
  )

  const defaultFundAmountInCents =
    amountInCents - selectedFundAmountInCents

  return {
    selectedFund,
    defaultFund,
    selectedFundAmount: fromCents(selectedFundAmountInCents),
    defaultFundAmount: fromCents(defaultFundAmountInCents),
  }
}