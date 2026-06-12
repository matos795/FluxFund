import type { AccountSummary } from "../accounts/types"
import type { BeneficiarySummary } from "../beneficiaries/beneficiary-types"
import type { CategorySummary } from "../categories/category-types"
import type { FundSummary } from "../funds/fund-types"

export type FinancialTransactionType =
  | "INCOME"
  | "EXPENSE"
  | "TRANSFER"

export type FinancialTransactionSource =
  | "MANUAL"
  | "OFX"
  | "CSV"
  | "CREDIT_CARD"

export type FinancialTransactionStatus =
  | "PENDING"
  | "SETTLED"
  | "CANCELED"
  | "IMPORTED"

export type TransactionAllocation = {
  id: string
  financialTransactionId: string
  fund: FundSummary
  beneficiary: BeneficiarySummary | null
  amount: number
  referenceMonth: string | null
  createdAt: string
  updatedAt: string
}

export type FinancialTransaction = {
  id: string
  account: AccountSummary
  category: CategorySummary | null

  type: FinancialTransactionType
  source: FinancialTransactionSource
  status: FinancialTransactionStatus

  externalId: string | null

  creditCardStatementId: string | null
  installmentNumber: number | null
  installmentCount: number | null

  dueDate: string | null
  settlementDate: string | null

  expectedAmount: number
  settledAmount: number | null

  interestAmount: number
  discountAmount: number

  description: string
  rawDescription: string | null
  documentNumber: string | null

  allocations: TransactionAllocation[]

  importedAt: string | null
  classifiedAt: string | null

  createdAt: string
  updatedAt: string

  attachmentCount: number
  paymentProofAttachmentCount: number
  fiscalAttachmentCount: number
}

export type CreateFinancialTransactionRequest = {
  accountId: string
  categoryId?: string | null
  type: FinancialTransactionType

  dueDate?: string | null
  settlementDate?: string | null

  expectedAmount: number
  settledAmount?: number | null

  description?: string | null
  documentNumber?: string | null

  allocations?: []
}

export type UpdateFinancialTransactionRequest = {
  type: FinancialTransactionType
  categoryId?: string | null

  dueDate?: string | null
  settlementDate?: string | null

  expectedAmount: number
  settledAmount?: number | null

  description?: string | null
  documentNumber?: string | null
}

export type CreateTransactionAllocationRequest = {
  fundId: string
  beneficiaryId?: string | null
  amount: number
  referenceMonth: string | null
}

export type UpdateTransactionAllocationRequest = {
  fundId?: string | null
  beneficiaryId?: string | null
  amount?: number | null
  referenceMonth: string | null
}

export type ImportOfxResponse = {
  imported: number
  ignoredDuplicates: number
  failed: number
  errors: string[]
}

export type ClassifyFinancialTransactionRequest = {
  type: "INCOME" | "EXPENSE" | "TRANSFER"
  categoryId?: string | null
  dueDate?: string
  settlementDate?: string
  expectedAmount?: number
  settledAmount?: number
  description?: string
  documentNumber?: string
  allocations?: {
    fundId: string
    beneficiaryId?: string | null
    amount: number
    referenceMonth: string | null
  }[]
}

export type ImportCsvResponse = {
  imported: number
  ignoredDuplicates: number
  failed: number
  errors: string[]
}