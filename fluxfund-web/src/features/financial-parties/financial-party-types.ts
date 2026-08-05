import type { FinancialCommitment, FinancialCommitmentAllocationSummary } from "../financial-commitments/financial-commitment-types"
import type { Receipt } from "../receipts/receipt-types"
import type { SupportAgreement } from "../support-agreements/support-agreement-types"

export type FinancialPartyType =
    | "INDIVIDUAL"
    | "LEGAL_ENTITY"

export type FinancialPartyRole =
    | "INCOME_SOURCE"
    | "PAYMENT_RECIPIENT"

export type FinancialPartyClassification =
    | "DONOR"
    | "SUPPORTER"
    | "CUSTOMER"
    | "SPONSOR"
    | "MEMBER"
    | "SUPPLIER"
    | "SERVICE_PROVIDER"
    | "EMPLOYEE"
    | "MISSIONARY"
    | "PROJECT_RESPONSIBLE"
    | "OTHER"

export type FinancialParty = {
    id: string
    name: string
    type: FinancialPartyClassification
    partyType: FinancialPartyType
    roles: FinancialPartyRole[]

    document: string | null
    email: string | null
    phone: string | null

    legalName: string | null
    contactPerson: string | null

    addressLine: string | null
    addressNumber: string | null
    addressComplement: string | null
    neighborhood: string | null
    city: string | null
    state: string | null
    zipCode: string | null

    notes: string | null

    active: boolean
    createdAt: string
    updatedAt: string | null
}

export type FinancialPartySummary = {
    id: string
    name: string
    partyType: FinancialPartyType
    classification: FinancialPartyClassification
    roles: FinancialPartyRole[]
    document: string | null
}

export type FinancialPartyOption = {
    id: string
    label: string
    partyType: FinancialPartyType
    classification: FinancialPartyClassification
    roles: FinancialPartyRole[]
    document: string | null
}

export type FinancialPartyPayload = {
    name: string
    type: FinancialPartyClassification
    partyType: FinancialPartyType
    roles: FinancialPartyRole[]

    document: string
    email: string
    phone: string

    legalName: string
    contactPerson: string

    addressLine: string
    addressNumber: string
    addressComplement: string
    neighborhood: string
    city: string
    state: string
    zipCode: string

    notes: string
}

export type CreateFinancialPartyRequest =
    FinancialPartyPayload

export type UpdateFinancialPartyRequest =
    FinancialPartyPayload & {
        id: string
    }

export type GetFinancialPartiesParams = {
    page?: number
    size?: number
    search?: string
    partyType?: FinancialPartyType
    classification?: FinancialPartyClassification
    role?: FinancialPartyRole
    active?: boolean
}

export type FinancialPartyActivityRole =
    | "INCOME_SOURCE"
    | "DESIGNATED_RECIPIENT"
    | "PAYMENT_RECIPIENT"

export type FinancialPartyActivity = {
    allocationId: string
    transactionId: string

    transactionType:
    | "INCOME"
    | "EXPENSE"

    settlementDate: string

    description: string

    accountName: string
    fundName: string

    amount: number

    referenceMonth:
    string | null

    roles:
    FinancialPartyActivityRole[]

    financialCommitment:
    FinancialCommitmentAllocationSummary | null
}

export type FinancialPartyOverviewSummary = {
    receivedFromParty: number
    destinedToParty: number
    paidToParty: number

    transactionCount: number

    activeCommitmentCount: number

    activeSupportAgreementCount: number

    issuedReceiptCount: number

    issuedReceiptAmount: number
}

export type FinancialPartyOverview = {
    party:
    FinancialParty

    summary:
    FinancialPartyOverviewSummary

    recentActivities:
    FinancialPartyActivity[]

    commitments:
    FinancialCommitment[]

    supportAgreements:
    SupportAgreement[]

    receipts:
    Receipt[]
} 