export type ReceiptSourceType =
    | "MANUAL"
    | "TRANSACTION"
    | "ALLOCATION"

export type ReceiptStatus =
    | "DRAFT"
    | "ISSUED"
    | "CANCELED"

export type ReceiptDirection =
    | "RECEIVED_BY_ORGANIZATION"
    | "PAID_BY_ORGANIZATION"

export type ReceiptType =
    | "DONATION"
    | "MEMBER_CONTRIBUTION"
    | "CUSTOMER_PAYMENT"
    | "SPONSORSHIP"
    | "OTHER_INCOME"
    | "SUPPORT_PAYMENT"
    | "SUPPLIER_PAYMENT"
    | "SERVICE_PAYMENT"
    | "REIMBURSEMENT"
    | "OTHER_PAYMENT"

export type ReceiptPartySnapshot = {
    partyId: string | null
    name: string
    document: string | null
    address: string | null
}

export type Receipt = {
    id: string
    organizationId: string

    sourceType:
    ReceiptSourceType

    financialTransactionId:
    string | null

    transactionAllocationId:
    string | null

    receiptType:
    ReceiptType

    direction:
    ReceiptDirection

    status:
    ReceiptStatus

    sequenceYear:
    number | null

    sequenceNumber:
    number | null

    receiptNumber:
    string | null

    issueDate:
    string | null

    paymentDate:
    string

    amount: number

    counterparty:
    ReceiptPartySnapshot

    beneficiary:
    ReceiptPartySnapshot | null

    fundId:
    string | null

    fundName:
    string | null

    purposeDescription:
    string

    placeCity:
    string | null

    placeState:
    string | null

    signatoryName:
    string | null

    signatoryTitle:
    string | null

    notes:
    string | null

    fileAvailable:
    boolean

    issuedAt:
    string | null

    canceledAt:
    string | null

    cancellationReason:
    string | null

    replacesReceiptId:
    string | null

    createdAt: string
    updatedAt: string | null
}

export type CreateReceiptDraftRequest = {
    sourceType:
    ReceiptSourceType

    financialTransactionId?:
    string | null

    transactionAllocationId?:
    string | null

    receiptType:
    ReceiptType

    amount?:
    number

    paymentDate?:
    string

    counterpartyPartyId?:
    string | null

    counterpartyName?:
    string | null

    counterpartyDocument?:
    string | null

    counterpartyAddress?:
    string | null

    beneficiaryPartyId?:
    string | null

    beneficiaryName?:
    string | null

    beneficiaryDocument?:
    string | null

    fundId?:
    string | null

    fundName?:
    string | null

    purposeDescription?:
    string | null

    placeCity?:
    string | null

    placeState?:
    string | null

    signatoryName?:
    string | null

    signatoryTitle?:
    string | null

    notes?:
    string | null
}

export type GetReceiptsParams = {
    page?: number
    size?: number

    status?:
    ReceiptStatus

    receiptType?:
    ReceiptType
}

export type ReceiptDraftSource = {
    sourceType:
    ReceiptSourceType

    financialTransactionId?:
    string

    transactionAllocationId?:
    string

    defaultReceiptType?:
    ReceiptType

    defaultAmount?:
    number

    defaultPaymentDate?:
    string

    defaultPurpose?:
    string

    description?:
    string
}