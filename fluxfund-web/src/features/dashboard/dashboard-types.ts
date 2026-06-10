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