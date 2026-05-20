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