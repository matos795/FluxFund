import type { FinancialTransaction } from "./financial-transaction-types"

export function getFinancialTransactionTypeBadgeClass(type: FinancialTransaction["type"]) {
  switch (type) {
    case "INCOME":
      return "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
    case "EXPENSE":
      return "bg-rose-100 text-rose-700 hover:bg-rose-100"
    case "TRANSFER":
      return "bg-blue-100 text-blue-700 hover:bg-blue-100"
    default:
      return ""
  }
}

export function getFinancialTransactionStatusBadgeClass(status: FinancialTransaction["status"]) {
  switch (status) {
    case "SETTLED":
      return "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
    case "PENDING":
      return "bg-amber-100 text-amber-700 hover:bg-amber-100"
    case "IMPORTED":
      return "bg-blue-100 text-blue-700 hover:bg-blue-100"
    case "CANCELED":
      return "bg-muted text-muted-foreground hover:bg-muted"
    default:
      return ""
  }
}