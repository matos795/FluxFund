import type { AccountSummary } from "../accounts/types"
import type { FinancialTransaction } from "../financial-transactions/financial-transaction-types"

export type CreditCardStatementStatus =
  | "OPEN"
  | "CLOSED"
  | "PAID"
  | "CANCELED"

export type CreditCardStatement = {
  id: string
  creditCardAccount: AccountSummary
  paymentAccount: AccountSummary | null
  paymentTransactionId: string | null
  name: string
  closingDate: string | null
  dueDate: string
  paymentDate: string | null
  status: CreditCardStatementStatus
  totalAmount: number
  itemCount: number
  createdAt: string
  updatedAt: string | null
}

export type CreateCreditCardStatementRequest = {
  creditCardAccountId: string
  name: string
  closingDate?: string | null
  dueDate: string
}

export type CreateCreditCardItemRequest = {
  purchaseDate: string
  description: string
  amount: number
  categoryId?: string | null
  documentNumber?: string | null
  installmentNumber?: number | null
  installmentCount?: number | null
  allocations?: {
    fundId: string
    beneficiaryId?: string | null
    amount: number
    referenceMonth: string | null
  }[]
}

export type PayCreditCardStatementRequest = {
  paymentAccountId: string
  paymentDate: string
  paymentTransactionId?: string | null
}

export type CreditCardStatementWithItems = CreditCardStatement & {
  items?: FinancialTransaction[]
}

export type CreditCardStatementImportResponse = {
  importedCount: number
  ignoredDuplicateCount: number
  importedItems: FinancialTransaction[]
  failedCount: number
  errors: string[]
}