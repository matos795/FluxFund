import type {
    FinancialPartySummary,
} from "@/features/financial-parties/financial-party-types"

import type {
    FundSummary,
} from "@/features/funds/fund-types"

export type FinancialCommitmentDirection =
    | "RECEIVABLE"
    | "PAYABLE"

export type FinancialCommitmentType =
    | "DONATION"
    | "CUSTOMER_PAYMENT"
    | "SPONSORSHIP"
    | "MEMBER_CONTRIBUTION"
    | "SUPPLIER_PAYMENT"
    | "SALARY"
    | "SERVICE_PAYMENT"
    | "REIMBURSEMENT"
    | "OTHER"

export type FinancialCommitmentRecurrence =
    | "ONE_TIME"
    | "MONTHLY"

export type FinancialCommitmentStatus =
    | "ACTIVE"
    | "SCHEDULED"
    | "EXPIRED"
    | "INACTIVE"

export type FinancialCommitment = {
    id: string
    organizationId: string

    party:
    FinancialPartySummary

    designatedRecipient:
    FinancialPartySummary | null

    fund:
    FundSummary

    direction:
    FinancialCommitmentDirection

    commitmentType:
    FinancialCommitmentType

    recurrence:
    FinancialCommitmentRecurrence

    amount: number
    dueDay: number | null

    startDate: string
    endDate: string | null

    status:
    FinancialCommitmentStatus

    active: boolean
    description: string | null

    createdAt: string
    updatedAt: string | null
}

export type FinancialCommitmentPayload = {
    partyId: string

    designatedRecipientId:
    string | null

    fundId: string

    direction: FinancialCommitmentDirection

    commitmentType: FinancialCommitmentType

    recurrence: FinancialCommitmentRecurrence

    amount: number
    dueDay: number | null

    startDate: string
    endDate: string | null

    description: string | null
}

export type CreateFinancialCommitmentRequest = FinancialCommitmentPayload

export type UpdateFinancialCommitmentRequest = FinancialCommitmentPayload

export type GetFinancialCommitmentsParams = {
    page?: number
    size?: number
    sort?: string

    search?: string

    direction?: FinancialCommitmentDirection

    commitmentType?: FinancialCommitmentType

    recurrence?: FinancialCommitmentRecurrence

    status?: FinancialCommitmentStatus

    partyId?: string

    designatedRecipientId?: string

    fundId?: string

    referenceDate?: string
}

export type FinancialCommitmentAllocationSummary = {
  id: string

  direction:
    FinancialCommitmentDirection

  commitmentType:
    FinancialCommitmentType

  recurrence:
    FinancialCommitmentRecurrence

  amount: number
  dueDay: number | null

  startDate: string
  endDate: string | null

  party:
    FinancialPartySummary

  designatedRecipient:
    FinancialPartySummary | null

  plannedFund:
    FundSummary

  active: boolean
}

export type FinancialCommitmentAllocationSuggestion = {
  commitment:
    FinancialCommitmentAllocationSummary

  realizedAmount: number
  remainingAmount: number
  suggestedAmount: number

  exactFundMatch: boolean
  fulfilled: boolean
}

export type CreateFinancialCommitmentVersionRequest = {
  amount: number
  startDate: string
  description?: string | null
}

export type FinancialCommitmentReconciliationStatus =
  | "EXACT"
  | "REVIEW"
  | "NO_MATCH"

export type FinancialCommitmentReconciliationItem = {
  allocationId: string
  transactionId: string

  settlementDate: string
  description: string | null

  transactionType:
    | "INCOME"
    | "EXPENSE"

  accountName: string

  fund:
    FundSummary

  sourceParty:
    FinancialPartySummary | null

  recipientParty:
    FinancialPartySummary | null

  referenceMonth: string
  amount: number

  matchStatus:
    FinancialCommitmentReconciliationStatus

  suggestions:
    FinancialCommitmentAllocationSuggestion[]
}

export type GetFinancialCommitmentReconciliationParams = {
  startMonth: string
  endMonth: string

  transactionType?:
    | "INCOME"
    | "EXPENSE"

  page?: number
  size?: number
}

export type LinkFinancialCommitmentReconciliationRequest = {
  transactionId: string
  allocationId: string
  financialCommitmentId: string
}