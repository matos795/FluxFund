export type AccountType =
  | "BANK"
  | "CASH"
  | "DIGITAL_WALLET"
  | "CREDIT_CARD"

export type Account = {
  id: string
  name: string
  type: AccountType
  bankCode: string | null
  bankName: string | null
  agency: string | null
  accountNumber: string | null
  initialBalance: number
  initialBalanceDate?: string | null
  active: boolean
  createdAt: string
  updatedAt: string
}

export type CreateAccountRequest = {
  name: string
  type: AccountType
  bankCode?: string
  bankName?: string
  agency?: string
  accountNumber?: string
  initialBalance: number
  initialBalanceDate?: string
}

export type UpdateAccountRequest = {
  id: string
  name: string
  type: AccountType
  bankCode?: string
  bankName?: string
  agency?: string
  accountNumber?: string
  initialBalance: number
  initialBalanceDate?: string
  active: boolean
}

export type AccountSummary = {
  id: string
  name: string
  type: AccountType
}