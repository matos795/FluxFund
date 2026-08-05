import type { FinancialCommitmentAllocationSummary, FinancialCommitmentDirection } from "../financial-commitments/financial-commitment-types"

export type CategoryResultItem = {
  categoryId: string | null
  categoryName: string
  parentCategoryId: string | null
  parentCategoryName: string | null
  type: "INCOME" | "EXPENSE" | "TRANSFER"
  total: number
  transactionCount: number
}

export type CategoryResultReport = {
  startDate: string
  endDate: string
  incomeTotal: number
  expenseTotal: number
  netTotal: number
  items: CategoryResultItem[]
}

export type CategoryResultGroup = {
  groupId: string
  groupName: string
  type: "INCOME" | "EXPENSE" | "TRANSFER"
  total: number
  transactionCount: number
  children: CategoryResultItem[]
}

export type FundReportItem = {
  fundId: string
  fundName: string
  initialBalance: number
  incomeAllocated: number
  expenseAllocated: number
  periodBalance: number
  currentBalance: number
  allocationCount: number
}

export type FundReport = {
  startDate: string
  endDate: string
  fundsTotalBalance: number
  incomeAllocatedTotal: number
  expenseAllocatedTotal: number
  negativeFundsCount: number
  items: FundReportItem[]
}

export type AccountabilityReportItem = {
  beneficiaryId: string
  beneficiaryName: string
  fundId: string
  fundName: string

  openingPendingAmount: number

  allocatedAmount: number
  transferredAmount: number
  commitmentAmount: number
  payableAmount: number
  pendingAmount: number
  allocationCount: number
}

export type AccountabilityReport = {
  startDate: string
  endDate: string

  openingPendingTotal: number

  allocatedTotal: number
  transferredTotal: number
  commitmentTotal: number
  payableTotal: number
  pendingTotal: number
  beneficiariesWithPendingBalance: number
  items: AccountabilityReportItem[]
}

export type AccountabilityAccountBreakdown = {
  accountId: string
  accountName: string
  bankName: string | null
  allocatedAmount: number
  transferredAmount: number
  pendingAmount: number
  allocationCount: number
}

export type AccountabilityByAccountReportItem = {
  beneficiaryId: string
  beneficiaryName: string
  fundId: string
  fundName: string

  openingPendingAmount: number

  allocatedAmount: number
  transferredAmount: number
  commitmentAmount: number
  payableAmount: number
  pendingAmount: number
  allocationCount: number
  accounts: AccountabilityAccountBreakdown[]
}

export type AccountabilityByAccountReport = {
  startDate: string
  endDate: string

  openingPendingTotal: number

  allocatedTotal: number
  transferredTotal: number
  commitmentTotal: number
  payableTotal: number
  pendingTotal: number
  beneficiariesWithPendingBalance: number
  items: AccountabilityByAccountReportItem[]
}

export type PendingTransactionItem = {
  id: string
  date: string | null
  description: string | null
  rawDescription: string | null
  accountName: string
  categoryName: string | null
  amount: number
  reason: string
}

export type PendingCreditCardStatementItem = {
  id: string
  name: string
  accountName: string
  status: string
  dueDate: string | null
  totalAmount: number
  pendingItemsCount: number
  reason: string
}

export type PendingFundItem = {
  id: string
  name: string
  currentBalance: number
  reason: string
}

export type PendingItemsReport = {
  unclassifiedCount: number
  unallocatedCount: number
  missingDocumentsCount: number
  pendingCreditCardStatementsCount: number
  negativeFundsCount: number

  unclassifiedTransactions: PendingTransactionItem[]
  unallocatedTransactions: PendingTransactionItem[]
  missingDocumentTransactions: PendingTransactionItem[]
  pendingCreditCardStatements: PendingCreditCardStatementItem[]
  negativeFunds: PendingFundItem[]
}

export type AccountCashFlowItem = {
  accountId: string
  accountName: string
  accountType:
  | "BANK"
  | "CASH"
  | "DIGITAL_WALLET"
  | "CREDIT_CARD"
  | "OTHER"
  bankName: string | null
  initialBalanceDate: string | null
  openingBalance: number
  initialBalanceInPeriod: number
  incomeAmount: number
  expenseAmount: number
  transferInAmount: number
  transferOutAmount: number
  transferNetAmount: number
  netAmount: number
  closingBalance: number
  currentBalance: number
  transactionCount: number
}

export type AccountCashFlowReport = {
  startDate: string
  endDate: string
  openingBalanceTotal: number
  initialBalanceInPeriodTotal: number
  incomeTotal: number
  expenseTotal: number
  transferInTotal: number
  transferOutTotal: number
  transferNetTotal: number
  netTotal: number
  closingBalanceTotal: number
  currentBalanceTotal: number
  transactionCount: number
  items: AccountCashFlowItem[]
}

export type FinancialCommitmentRealizationStatus =
  | "NOT_DUE"
  | "PENDING"
  | "PARTIAL"
  | "FULFILLED"
  | "EXCEEDED"

export type FinancialCommitmentMonthlyReportItem = {
  commitment:
  FinancialCommitmentAllocationSummary

  referenceMonth: string
  dueDate: string

  expectedAmount: number
  realizedAmount: number
  pendingAmount: number
  exceededAmount: number

  status:
  FinancialCommitmentRealizationStatus

  overdue: boolean

  allocationCount: number

  lastSettlementDate:
  string | null
}

export type FinancialCommitmentMonthlyReport = {
  referenceMonth: string

  direction:
  FinancialCommitmentDirection

  expectedTotal: number
  realizedTotal: number
  pendingTotal: number
  exceededTotal: number

  totalCommitments: number

  notDueCount: number
  pendingCount: number
  partialCount: number
  fulfilledCount: number
  exceededCount: number

  items:
  FinancialCommitmentMonthlyReportItem[]
}

export type GetFinancialCommitmentMonthlyReportParams = {
  referenceMonth: string

  direction:
  FinancialCommitmentDirection

  partyId?: string

  designatedRecipientId?:
  string

  fundId?: string
}

export type FinancialForecastMonth = {
  referenceMonth: string

  receivableAmount: number

  genericPayableAmount: number

  supportAmount: number

  payableAmount: number

  netAmount: number

  cumulativeNetAmount: number

  receivableCount: number

  genericPayableCount: number

  supportCount: number
}

export type FinancialForecastReport = {
  startMonth: string
  endMonth: string

  monthCount: number

  includesSupport: boolean

  receivableTotal: number

  genericPayableTotal: number

  supportTotal: number

  payableTotal: number

  netTotal: number

  lowestCumulativeNet: number

  lowestCumulativeMonth:
  string | null

  months:
  FinancialForecastMonth[]
}

export type GetFinancialForecastReportParams = {
  startMonth: string

  months: number

  fundId?: string

  includeSupport: boolean
}