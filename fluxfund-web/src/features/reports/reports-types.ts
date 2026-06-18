export type CategoryResultItem = {
  categoryId: string
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
  accountType: "BANK" | "CASH" | "DIGITAL_WALLET" | "CREDIT_CARD"
  bankName: string | null
  openingBalance: number
  incomeAmount: number
  expenseAmount: number
  transferAmount: number
  netAmount: number
  closingBalance: number
  transactionCount: number
}

export type AccountCashFlowReport = {
  startDate: string
  endDate: string
  openingBalanceTotal: number
  incomeTotal: number
  expenseTotal: number
  transferTotal: number
  netTotal: number
  closingBalanceTotal: number
  transactionCount: number
  items: AccountCashFlowItem[]
}