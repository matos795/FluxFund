import type { FinancialTransactionSource, FinancialTransactionStatus, FinancialTransactionType } from "./financial-transaction-types"

export const financialTransactionTypeLabels: Record<FinancialTransactionType, string> = {
  INCOME: "Receita",
  EXPENSE: "Despesa",
  TRANSFER: "Transferência",
}

export const financialTransactionStatusLabels: Record<FinancialTransactionStatus, string> = {
  PENDING: "Pendente",
  SETTLED: "Baixada",
  CANCELED: "Cancelada",
  IMPORTED: "Importada",
}

export const financialTransactionSourceLabels: Record<FinancialTransactionSource, string> = {
  MANUAL: "Manual",
  OFX: "OFX",
  CSV: "CSV",
  CREDIT_CARD: "Cartão de crédito",
}