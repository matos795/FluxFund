import type { FinancialTransaction } from "@/features/financial-transactions/financial-transaction-types";

export function needsFinancialTransactionClassification(
  transaction: FinancialTransaction,
) {
  return (
    transaction.status === "SETTLED" &&
    transaction.type !== "TRANSFER" &&
    !transaction.category &&
    (
      transaction.source === "OFX" ||
      transaction.source === "CSV" ||
      transaction.source === "CREDIT_CARD"
    )
  )
}