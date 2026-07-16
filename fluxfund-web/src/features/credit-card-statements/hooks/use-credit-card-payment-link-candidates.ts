import { useQuery } from "@tanstack/react-query"

import { getFinancialTransactions } from "@/features/financial-transactions/financial-transaction-api"
import type { FinancialTransaction } from "@/features/financial-transactions/financial-transaction-types"
import type { CreditCardStatementPayment } from "../credit-card-statement-types"

type UseCreditCardPaymentLinkCandidatesParams = {
  payment?: CreditCardStatementPayment
  paymentAccountId?: string
}

function addDays(date: string, days: number) {
  const parsedDate = new Date(`${date}T00:00:00`)
  parsedDate.setDate(parsedDate.getDate() + days)
  return parsedDate.toISOString().slice(0, 10)
}

function getTransactionAmount(transaction: FinancialTransaction) {
  return Math.abs(
    transaction.settledAmount ?? transaction.expectedAmount ?? 0,
  )
}

function normalizeText(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
}

function scoreCandidate(
  transaction: FinancialTransaction,
  payment: CreditCardStatementPayment,
) {
  let score = 100

  if (
    payment.statementExternalId &&
    transaction.externalId === payment.statementExternalId
  ) {
    score += 1000
  }

  if (transaction.settlementDate === payment.paymentDate) {
    score += 40
  }

  const text = normalizeText(
    `${transaction.description ?? ""} ${transaction.rawDescription ?? ""}`,
  )

  if (text.includes("fatura")) score += 30
  if (text.includes("cartao")) score += 20
  if (text.includes("pagamento")) score += 10

  return score
}

export function useCreditCardPaymentLinkCandidates({
  payment,
  paymentAccountId,
}: UseCreditCardPaymentLinkCandidatesParams) {
  return useQuery({
    queryKey: [
      "credit-card-payment-link-candidates",
      payment?.id,
      paymentAccountId,
      payment?.amount,
      payment?.paymentDate,
    ],
    enabled:
      Boolean(payment) &&
      Boolean(paymentAccountId) &&
      payment?.linked === false,
    queryFn: async () => {
      if (!payment || !paymentAccountId) {
        return []
      }

      const result = await getFinancialTransactions({
        page: 0,
        size: 200,
        accountId: paymentAccountId,
        status: "SETTLED",
        type: "EXPENSE",
        onlyUnclassified: true,
        settlementDateFrom: addDays(payment.paymentDate, -30),
        settlementDateTo: addDays(payment.paymentDate, 30),
        sort: "settlementDate,desc",
      })
      return result.content
        .filter((transaction) => transaction.type !== "TRANSFER")
        .filter(
          (transaction) =>
            (transaction.allocations?.length ?? 0) === 0,
        )
        .filter(
          (transaction) =>
            Math.abs(
              getTransactionAmount(transaction) -
              payment.amount,
            ) < 0.01,
        )
        .map((transaction) => ({
          transaction,
          score: scoreCandidate(transaction, payment),
        }))
        .sort((a, b) => b.score - a.score)
    },
  })
}
