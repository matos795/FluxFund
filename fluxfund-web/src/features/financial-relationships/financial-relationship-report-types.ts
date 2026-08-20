export type FinancialRelationshipPartySummary = {
    partyId: string
    partyName: string
    totalAmount: number
    sharePercentage: number
    allocationCount: number
    activeMonthCount: number
    firstSettlementDate: string | null
    lastSettlementDate: string | null
}

export type FinancialRelationshipMonth = {
    referenceMonth: string
    receivedFromPartiesAmount: number
    paidToPartiesAmount: number
}

export type FinancialRelationshipCommitmentReliability = {
    expectedDueAmount: number
    realizedAmount: number
    coveredExpectedAmount: number
    pendingAmount: number
    exceededAmount: number
    fulfillmentPercentage: number
    dueOccurrenceCount: number
    fulfilledOccurrenceCount: number
    partialOccurrenceCount: number
    pendingOccurrenceCount: number
    exceededOccurrenceCount: number
}

export type FinancialRelationshipReport = {
    startDate: string
    endDate: string
    monthCount: number
    receivedFromPartiesTotal: number
    paidToPartiesTotal: number
    incomeSourceCount: number
    paymentRecipientCount: number
    uniqueRelationshipCount: number
    topFiveIncomeConcentrationPercentage: number
    topFivePaymentConcentrationPercentage: number
    commitmentReliability: FinancialRelationshipCommitmentReliability
    months: FinancialRelationshipMonth[]
    incomeSources: FinancialRelationshipPartySummary[]
    paymentRecipients: FinancialRelationshipPartySummary[]
}