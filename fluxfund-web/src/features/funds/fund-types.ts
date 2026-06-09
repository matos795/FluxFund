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