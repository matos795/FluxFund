import type { AccountSummary } from "../accounts/types"
import type {
  FinancialTransaction,
  FiscalDocumentPolicy,
} from "../financial-transactions/financial-transaction-types"

export type CreditCardStatementStatus =
  | "OPEN"
  | "CLOSED"
  | "PAID"
  | "CANCELED"

export type CreditCardStatementPaymentStatus =
  | "UNPAID"
  | "PARTIALLY_PAID"
  | "PAID"

export type CreditCardStatementDocument = {
  originalFilename: string
  contentType: string
  sizeBytes: number
  uploadedAt: string
}

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
  paymentStatus: CreditCardStatementPaymentStatus
  statementDocument: CreditCardStatementDocument | null
  previousBalanceAmount: number
  totalAmount: number
  paidAmount: number
  outstandingAmount: number
  itemCount: number
  paymentCount: number
  unlinkedPaymentCount: number
  lastPaymentDate: string | null
  createdAt: string
  updatedAt: string | null
}

export type CreditCardStatementPayment = {
  id: string
  paymentAccount: AccountSummary | null
  paymentTransactionId: string | null
  statementExternalId: string | null
  paymentDate: string
  amount: number
  description: string | null
  linked: boolean
  openingBalance: boolean
  createdAt: string
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
  fiscalDocumentPolicy?: FiscalDocumentPolicy
  fiscalDocumentNote?: string | null
  installmentNumber?: number | null
  installmentCount?: number | null
  allocations?: {
    fundId: string
    beneficiaryId?: string | null
    sourcePartyId?: string | null
    recipientPartyId?: string | null
    amount: number
    referenceMonth: string | null
  }[]
}

export type PayCreditCardStatementRequest = {
  paymentAccountId: string
  paymentDate: string
  amount: number
  paymentTransactionId?: string | null
}

export type LinkCreditCardStatementPaymentRequest = {
  paymentAccountId: string
  paymentTransactionId: string
}

export type CreditCardStatementWithItems = CreditCardStatement & {
  items?: FinancialTransaction[]
}

export type CreditCardStatementImportResponse = {
  importedCount: number
  detectedPaymentCount: number
  reconciledPaymentCount: number
  ignoredPreviousStatementPaymentCount: number
  ignoredDuplicateCount: number
  importedItems: FinancialTransaction[]
  reviewRequiredCount: number
  failedCount: number
  warnings: string[]
  errors: string[]
}
