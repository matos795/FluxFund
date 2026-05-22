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