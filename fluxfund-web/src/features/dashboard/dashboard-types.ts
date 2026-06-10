export type DashboardSummary = {
  startDate: string
  endDate: string

  incomeTotal: number
  expenseTotal: number
  netTotal: number

  accountsTotalBalance: number
  fundsTotalBalance: number

  transactionCount: number
  unclassifiedCount: number
  unallocatedCount: number
}

export type MonthlyCashFlowItem = {
  month: string
  label: string
  income: number
  expense: number
  net: number
}

export type ExpenseByCategoryItem = {
  categoryId: string
  categoryName: string
  amount: number
  percentage: number
}

export type FundOverviewItem = {
  fundId: string
  fundName: string
  currentBalance: number
  incomeAllocated: number
  expenseAllocated: number
  periodBalance: number
}

export type DashboardAlerts = {
  unclassifiedCount: number
  unallocatedCount: number
  negativeFundsCount: number
  expensesWithoutFiscalDocumentCount: number
}

export type DashboardTransactionActionItem = {
  transactionId: string
  settlementDate: string | null
  description: string | null
  rawDescription: string | null
  accountName: string
  categoryName: string | null
  amount: number
}

export type DashboardFundActionItem = {
  fundId: string
  fundName: string
  currentBalance: number
}

export type DashboardActionItems = {
  unclassifiedTransactions: DashboardTransactionActionItem[]
  unallocatedTransactions: DashboardTransactionActionItem[]
  expensesWithoutFiscalDocument: DashboardTransactionActionItem[]
  negativeFunds: DashboardFundActionItem[]
}