import type {
  BankStatementDocument,
} from "@/features/bank-statement-documents/bank-statement-document-types"

export type {
  BankStatementDocument,
} from "@/features/bank-statement-documents/bank-statement-document-types"

export type ClosingDossierIssueType =
  | "PAYMENT_PROOF_MISSING"
  | "FISCAL_DOCUMENT_REQUIRED_MISSING"
  | "FISCAL_DOCUMENT_DECLARED_MISSING"

export type FiscalDocumentPolicy =
  | "CATEGORY"
  | "REQUIRED"
  | "WAIVED"
  | "MISSING"

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

  requiresBankStatement: boolean
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
  includeSupportReport: boolean
  includePayablesReport: boolean
  includeReceivablesReport: boolean
  includeFundMovementReport: boolean
}

export type ClosingDossierPreview = {
  periodStartDate: string
  periodEndDate: string

  includeAccountsWithoutMovement: boolean
  includeIncomes: boolean
  includeExpenses: boolean
  includeTransfers: boolean

  includesSupportReport: boolean
  includesPayablesReport: boolean
  includesReceivablesReport: boolean
  includesFundMovementReport: boolean

  selectedAccountCount: number
  includedAccountCount: number
  automaticSectionCount: number

  totalTransactionCount: number
  accountsWithoutMovementCount: number
  accountsWithoutBankStatementCount: number
  expensesWithoutPaymentProofCount: number
  expensesWithoutFiscalDocumentCount: number

  creditCardStatementCount: number
  creditCardStatementItemCount: number
  creditCardStatementsWithoutPdfCount: number

  creditCardStatements:
  ClosingDossierCreditCardStatementPreview[]

  accounts: ClosingDossierAccountPreview[]
}

export type ClosingDossierExtraDocumentType =
  | "ACCOUNTS_PAYABLE_REPORT"
  | "ACCOUNTS_RECEIVABLE_REPORT"
  | "MISSIONARY_SUPPORT_REPORT"
  | "CIELO_STATEMENT"
  | "INVESTMENT_STATEMENT"
  | "OTHER"

export type ClosingDossierExtraDocument = {
  id: string
  periodStartDate: string
  periodEndDate: string
  documentType: ClosingDossierExtraDocumentType
  title: string
  originalFilename: string
  contentType: string
  sizeBytes: number
  uploadedAt: string
  sortOrder: number
  createdAt: string
  updatedAt: string | null
}

export type ClosingDossierCreditCardStatementPreview = {
  statementId: string
  statementName: string

  creditCardAccountId: string
  creditCardAccountName: string

  status: "OPEN" | "CLOSED" | "PAID" | "CANCELED"

  closingDate: string | null
  dueDate: string

  totalAmount: number

  itemCount: number
  unclassifiedItemCount: number

  hasOfficialPdf: boolean

  fiscalDocumentIssues: ClosingDossierDocumentIssue[]
}