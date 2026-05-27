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
  pendingAmount: number
  allocationCount: number
}

export type AccountabilityReport = {
  startDate: string
  endDate: string
  allocatedTotal: number
  transferredTotal: number
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
  pendingAmount: number
  allocationCount: number
  accounts: AccountabilityAccountBreakdown[]
}

export type AccountabilityByAccountReport = {
  startDate: string
  endDate: string
  allocatedTotal: number
  transferredTotal: number
  pendingTotal: number
  beneficiariesWithPendingBalance: number
  items: AccountabilityByAccountReportItem[]
}