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