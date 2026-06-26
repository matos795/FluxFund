export type ClosingDossierIssueType =
  | "PAYMENT_PROOF_MISSING"
  | "FISCAL_DOCUMENT_REQUIRED_MISSING"
  | "FISCAL_DOCUMENT_DECLARED_MISSING"

export type FiscalDocumentPolicy =
  | "CATEGORY"
  | "REQUIRED"
  | "WAIVED"
  | "MISSING"

export type BankStatementDocument = {
  id: string
  accountId: string
  accountName: string
  periodStartDate: string
  periodEndDate: string
  originalFilename: string
  contentType: string
  sizeBytes: number
  uploadedAt: string
  createdAt: string
  updatedAt: string | null
}

export type ClosingDossierDocumentIssue = {
  transactionId: string
  settlementDate: string
  description: string | null
  rawDescription: string | null
  categoryName: string | null
  amount: number
  fiscalDocumentPolicy: FiscalDocumentPolicy | null
  fiscalDocumentNote: string | null
  issueType: ClosingDossierIssueType
}

export type ClosingDossierAccountPreview = {
  accountId: string
  accountName: string
  accountType: string

  hasMovement: boolean
  includedInDossier: boolean

  hasBankStatement: boolean
  bankStatementDocuments: BankStatementDocument[]

  transactionCount: number
  incomeTotal: number
  expenseTotal: number
  transferTotal: number

  paymentProofIssues: ClosingDossierDocumentIssue[]
  fiscalDocumentIssues: ClosingDossierDocumentIssue[]
}

export type ClosingDossierPreviewRequest = {
  periodStartDate: string
  periodEndDate: string
  accountIds: string[]
  includeAccountsWithoutMovement: boolean
  includeIncomes: boolean
  includeExpenses: boolean
  includeTransfers: boolean
}

export type ClosingDossierPreview = {
  periodStartDate: string
  periodEndDate: string

  includeAccountsWithoutMovement: boolean
  includeIncomes: boolean
  includeExpenses: boolean
  includeTransfers: boolean

  selectedAccountCount: number
  includedAccountCount: number

  totalTransactionCount: number
  accountsWithoutMovementCount: number
  accountsWithoutBankStatementCount: number
  expensesWithoutPaymentProofCount: number
  expensesWithoutFiscalDocumentCount: number

  accounts: ClosingDossierAccountPreview[]
}