export type Fund = {
    id: string
    name: string
    description: string | null
    initialBalance: number
    initialBalanceDate: string | null
    currentBalance: number
    active: boolean
    createdAt: string
    updatedAt: string
}

export type CreateFundRequest = {
    name: string
    description?: string
    initialBalance: number
    initialBalanceDate?: string
}

export type UpdateFundRequest = {
    id: string
    name?: string
    description?: string
    initialBalance?: number
    initialBalanceDate?: string
}

export type FundSummary = {
    id: string
    name: string
}

export type FundOption = {
  id: string
  label: string
  currentBalance: number
}

export type FundTransferStatus = "ACTIVE" | "CANCELED"

export type FundTransfer = {
  id: string
  sourceFund: FundSummary
  destinationFund: FundSummary
  amount: number
  transferDate: string
  description: string | null
  status: FundTransferStatus
  createdAt: string
  updatedAt: string | null
}

export type CreateFundTransferRequest = {
  sourceFundId: string
  destinationFundId: string
  transferDate: string
  amount: number
  description?: string | null
}