export type AccountType =
  | "BANK"
  | "CASH"
  | "DIGITAL_WALLET"
  | "CREDIT_CARD"

export type Account = {
  id: string
  organizationId: string
  name: string
  type: AccountType
  bankName: string | null
  bankCode: string | null
  agency: string | null
  accountNumber: string | null
  initialBalance: number
  initialBalanceDate: string
  active: boolean
  createdAt: string
  updatedAt: string
}