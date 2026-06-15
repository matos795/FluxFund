import type { FinancialTransaction } from "@/features/financial-transactions/financial-transaction-types"

export function getCreditCardItemAmount(item: FinancialTransaction) {
  return Math.abs(Number(item.settledAmount ?? item.expectedAmount ?? 0))
}

export function getCreditCardItemAllocatedAmount(item: FinancialTransaction) {
  return Math.abs(
    item.allocations?.reduce((total, allocation) => {
      return total + Math.abs(Number(allocation.amount ?? 0))
    }, 0) ?? 0,
  )
}

export function getCreditCardStatementItemsSummary(
  items: FinancialTransaction[],
) {
  const totalAmount = items.reduce((total, item) => {
    return total + getCreditCardItemAmount(item)
  }, 0)

  const classifiedItems = items.filter((item) => Boolean(item.category))
  const unclassifiedItems = items.filter((item) => !item.category)

  const classifiedAmount = classifiedItems.reduce((total, item) => {
    return total + getCreditCardItemAmount(item)
  }, 0)

  const unclassifiedAmount = unclassifiedItems.reduce((total, item) => {
    return total + getCreditCardItemAmount(item)
  }, 0)

  const allocatedAmount = items.reduce((total, item) => {
    return total + getCreditCardItemAllocatedAmount(item)
  }, 0)

  const unallocatedItems = items.filter((item) => {
    const amount = getCreditCardItemAmount(item)
    const allocated = getCreditCardItemAllocatedAmount(item)

    return allocated + 0.01 < amount
  })

  const unallocatedAmount = items.reduce((total, item) => {
    const amount = getCreditCardItemAmount(item)
    const allocated = getCreditCardItemAllocatedAmount(item)

    return total + Math.max(amount - allocated, 0)
  }, 0)

  return {
    totalAmount,
    classifiedAmount,
    unclassifiedAmount,
    allocatedAmount,
    unallocatedAmount,

    itemCount: items.length,
    classifiedCount: classifiedItems.length,
    unclassifiedCount: unclassifiedItems.length,
    unallocatedCount: unallocatedItems.length,

    hasReviewIssues:
      unclassifiedItems.length > 0 || unallocatedItems.length > 0,
  }
}