export type CategoryResultItem = {
  categoryId: string
  categoryName: string
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