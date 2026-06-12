import { useQuery } from "@tanstack/react-query"

import { getFinancialTransactions } from "@/features/financial-transactions/financial-transaction-api"
import type { FinancialTransaction } from "@/features/financial-transactions/financial-transaction-types"
import type { CreditCardStatement } from "../credit-card-statement-types"

type UseCreditCardPaymentCandidatesParams = {
  statement: CreditCardStatement
  paymentAccountId?: string
}

function addDays(date: string, days: number) {
  const parsedDate = new Date(`${date}T00:00:00`)
  parsedDate.setDate(parsedDate.getDate() + days)
  return parsedDate.toISOString().slice(0, 10)
}

function getTransactionAmount(transaction: FinancialTransaction) {
  return Math.abs(transaction.settledAmount ?? transaction.expectedAmount ?? 0)
}

function normalizeText(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
}

function scoreCandidate(
  transaction: FinancialTransaction,
  statement: CreditCardStatement,
) {
  let score = 0

  const amount = getTransactionAmount(transaction)
  const statementAmount = Math.abs(statement.totalAmount ?? 0)

  if (amount === statementAmount) {
    score += 100
  }

  const text = normalizeText(
    `${transaction.description ?? ""} ${transaction.rawDescription ?? ""}`,
  )

  if (text.includes("fatura")) score += 40
  if (text.includes("cartao")) score += 40
  if (text.includes("credito")) score += 20
  if (text.includes("bradesco")) score += 10

  if (transaction.settlementDate === statement.dueDate) {
    score += 20
  }

  return score
}

export function useCreditCardPaymentCandidates({
  statement,
  paymentAccountId,
}: UseCreditCardPaymentCandidatesParams) {
  return useQuery({
    queryKey: [
      "credit-card-payment-candidates",
      statement.id,
      paymentAccountId,
      statement.totalAmount,
      statement.dueDate,
    ],
    enabled: Boolean(paymentAccountId) && statement.totalAmount > 0,
    queryFn: async () => {
      const result = await getFinancialTransactions({
        page: 0,
        size: 100,
        accountId: paymentAccountId,
        source: "OFX",
        status: "SETTLED",
        type: "EXPENSE",
        settlementDateFrom: addDays(statement.dueDate, -15),
        settlementDateTo: addDays(statement.dueDate, 15),
        sort: "settlementDate,desc",
      })

      const candidates = result.content
        .filter((transaction) => transaction.type !== "TRANSFER")
        .map((transaction) => ({
          transaction,
          score: scoreCandidate(transaction, statement),
        }))
        .filter((candidate) => candidate.score > 0)
        .sort((a, b) => b.score - a.score)

      return candidates
    },
  })
}