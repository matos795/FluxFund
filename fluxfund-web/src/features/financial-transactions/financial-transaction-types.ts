import type { AccountSummary } from "../accounts/types"
import type { BeneficiarySummary } from "../beneficiaries/beneficiary-types"
import type { CategorySummary } from "../categories/category-types"
import type { FinancialCommitmentAllocationSummary } from "../financial-commitments/financial-commitment-types"
import type { FinancialPartySummary } from "../financial-parties/financial-party-types"
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

export type FiscalDocumentPolicy =
  | "CATEGORY"
  | "REQUIRED"
  | "WAIVED"
  | "MISSING"

export type TransferDirection = "IN" | "OUT"

export type TransactionAllocation = {
  id: string
  financialTransactionId: string
  fund: FundSummary

  beneficiary: BeneficiarySummary | null

  sourceParty: FinancialPartySummary | null

  recipientParty: FinancialPartySummary | null

  financialCommitment: FinancialCommitmentAllocationSummary | null

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

  purchaseDate: string | null
  dueDate: string | null
  settlementDate: string | null

  expectedAmount: number
  settledAmount: number | null

  interestAmount: number
  discountAmount: number

  description: string
  rawDescription: string | null
  documentNumber: string | null

  fiscalDocumentPolicy: FiscalDocumentPolicy
  fiscalDocumentNote: string | null

  allocations: TransactionAllocation[]

  importedAt: string | null
  classifiedAt: string | null

  createdAt: string
  updatedAt: string

  attachmentCount: number
  paymentProofAttachmentCount: number
  fiscalAttachmentCount: number

  transferDirection: TransferDirection | null
  transferGroupId: string | null
  transferCounterpartyAccount: AccountSummary | null
}

export type CreateAccountTransferRequest = {
  sourceAccountId: string
  destinationAccountId: string
  transferDate: string
  amount: number
  description?: string | null
  matchingTransactionId?: string | null
  allowUnmatchedCreation?: boolean
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

  fiscalDocumentPolicy?: FiscalDocumentPolicy
  fiscalDocumentNote?: string | null

  allocations?: CreateTransactionAllocationRequest[]
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

  fiscalDocumentPolicy?: FiscalDocumentPolicy
  fiscalDocumentNote?: string | null
}

export type CreateTransactionAllocationRequest = {
  fundId: string
  beneficiaryId?: string | null
  sourcePartyId?: string | null
  recipientPartyId?: string | null
  financialCommitmentId?: string | null
  amount: number
  referenceMonth: string | null
}

export type UpdateTransactionAllocationRequest = {
  fundId?: string | null
  beneficiaryId?: string | null
  sourcePartyId?: string | null
  recipientPartyId?: string | null
  amount?: number | null
  referenceMonth: string | null
  financialCommitmentId?: string | null
  clearFinancialCommitment?: boolean
}

export type ImportOfxResponse = {
  imported: number
  ignoredDuplicates: number
  failed: number
  errors: string[]
  importBatchId: string | null
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
  fiscalDocumentPolicy?: FiscalDocumentPolicy
  fiscalDocumentNote?: string | null
  transferDirection?: TransferDirection | null
  transferCounterpartyAccountId?: string | null
  allocations?: {
    fundId: string
    beneficiaryId?: string | null
    sourcePartyId?: string | null
    recipientPartyId?: string | null
    financialCommitmentId?: string | null
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

export type ClassificationSuggestionAllocation = {
  fund: FundSummary
  beneficiary: BeneficiarySummary | null
  sourceParty?: FinancialPartySummary | null
  recipientParty?: FinancialPartySummary | null
  amount: number
  referenceMonth: string | null
  source:
  | "HISTORY"
  | "SUPPORT_AGREEMENT"
}

export type ClassificationSuggestionConfidence =
  | "HIGH"
  | "MEDIUM"
  | "LOW"

export type ClassificationSuggestionEvidence = {
  historyCount: number
  categoryMatchCount: number
  categoryAgreementPercent: number
  allocationHistoryCount: number
  allocationMatchCount: number
  allocationAgreementPercent: number
  historyDates: string[]
  documentPolicyHistoryCount: number
  documentPolicyMatchCount: number
  documentPolicyAgreementPercent: number
}

export type FinancialTransactionClassificationSuggestion = {
  available: boolean
  source: "HISTORY" | null
  basedOnTransactionId: string | null
  type: "INCOME" | "EXPENSE" | "TRANSFER" | null
  category: CategorySummary | null
  description: string | null
  fiscalDocumentPolicy: FiscalDocumentPolicy | null
  fiscalDocumentNote: string | null
  allocations: ClassificationSuggestionAllocation[]
  confidence: ClassificationSuggestionConfidence | null
  evidence: ClassificationSuggestionEvidence | null
}

export type TransferMatchCandidate = {
  transactionId: string
  account: AccountSummary
  settlementDate: string
  amount: number
  description: string
  dateDistanceDays: number
}

export type TransferMatchSuggestion = {
  available: boolean
  suggestedDirection: TransferDirection | null
  candidates: TransferMatchCandidate[]
}

export type BulkCancelFinancialTransactionsRequest = {
  transactionIds:
  string[]
}

export type BulkCancelFinancialTransactionsResponse = {
  canceledCount:
  number
}

export type TransactionClassificationPrefill = {
  categoryId?: string
  description?: string

  allocation?: {
    fundId: string
    sourcePartyId?: string
    recipientPartyId?: string
  }
}