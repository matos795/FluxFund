import type { FinancialTransaction } from "@/features/financial-transactions/financial-transaction-types"

export function isCreditCardStatementCredit(
  item: FinancialTransaction,
) {
  return (
    item.technicalMovementType ===
    "CREDIT_CARD_STATEMENT_CREDIT"
  )
}

export function getCreditCardItemAmount(
  item: FinancialTransaction,
) {
  const amount = Math.abs(
    Number(
      item.settledAmount ??
      item.expectedAmount ??
      0,
    ),
  )

  return isCreditCardStatementCredit(item)
    ? -amount
    : amount
}

export function getCreditCardItemAllocatedAmount(
  item: FinancialTransaction,
) {
  return Math.abs(
    item.allocations?.reduce(
      (total, allocation) => {
        return (
          total +
          Math.abs(
            Number(allocation.amount ?? 0),
          )
        )
      },
      0,
    ) ?? 0,
  )
}

export function getCreditCardStatementItemsSummary(
  items: FinancialTransaction[],
) {
  const reviewableItems = items.filter(
    (item) => !item.technicalMovement,
  )

  const statementCredits = items.filter(
    isCreditCardStatementCredit,
  )

  const totalAmount = items.reduce(
    (total, item) => {
      return (
        total +
        getCreditCardItemAmount(item)
      )
    },
    0,
  )

  const creditAmount =
    statementCredits.reduce(
      (total, item) => {
        return (
          total +
          Math.abs(
            getCreditCardItemAmount(item),
          )
        )
      },
      0,
    )

  const classifiedItems =
    reviewableItems.filter(
      (item) => Boolean(item.category),
    )

  const unclassifiedItems =
    reviewableItems.filter(
      (item) => !item.category,
    )

  const classifiedAmount =
    classifiedItems.reduce(
      (total, item) => {
        return (
          total +
          getCreditCardItemAmount(item)
        )
      },
      0,
    )

  const unclassifiedAmount =
    unclassifiedItems.reduce(
      (total, item) => {
        return (
          total +
          getCreditCardItemAmount(item)
        )
      },
      0,
    )

  const allocatedAmount =
    reviewableItems.reduce(
      (total, item) => {
        return (
          total +
          getCreditCardItemAllocatedAmount(
            item,
          )
        )
      },
      0,
    )

  const unallocatedItems =
    reviewableItems.filter((item) => {
      const amount =
        getCreditCardItemAmount(item)

      const allocated =
        getCreditCardItemAllocatedAmount(
          item,
        )

      return allocated + 0.01 < amount
    })

  const unallocatedAmount =
    reviewableItems.reduce(
      (total, item) => {
        const amount =
          getCreditCardItemAmount(item)

        const allocated =
          getCreditCardItemAllocatedAmount(
            item,
          )

        return (
          total +
          Math.max(
            amount - allocated,
            0,
          )
        )
      },
      0,
    )

  return {
    totalAmount,
    creditAmount,
    classifiedAmount,
    unclassifiedAmount,
    allocatedAmount,
    unallocatedAmount,

    itemCount: items.length,
    creditCount:
      statementCredits.length,

    classifiedCount:
      classifiedItems.length,

    unclassifiedCount:
      unclassifiedItems.length,

    unallocatedCount:
      unallocatedItems.length,

    hasReviewIssues:
      unclassifiedItems.length > 0 ||
      unallocatedItems.length > 0,
  }
}