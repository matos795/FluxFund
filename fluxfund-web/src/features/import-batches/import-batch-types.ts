export type ImportBatchSourceType =
    | "OFX"
    | "CSV"

export type ImportBatchStatus =
    | "ACTIVE"
    | "UNDONE"

export type ImportBatch = {
    id: string

    accountId: string
    accountName: string
    bankName: string | null

    sourceType:
    ImportBatchSourceType

    importProfile:
    string | null

    originalFilename:
    string

    status:
    ImportBatchStatus

    importedCount:
    number

    ignoredDuplicatesCount:
    number

    failedCount:
    number

    importedAt:
    string

    undoneAt:
    string | null
}

export type GetImportBatchesParams = {
    page?: number
    size?: number
}

export type ImportBatchUndoBlocker =
    | "ALREADY_UNDONE"
    | "NO_IMPORTED_TRANSACTIONS"
    | "TRANSACTION_COUNT_MISMATCH"
    | "MODIFIED_TRANSACTIONS"
    | "CLASSIFIED_TRANSACTIONS"
    | "TRANSFER_TRANSACTIONS"
    | "ALLOCATIONS"
    | "ATTACHMENTS"
    | "RECEIPTS"
    | "CREDIT_CARD_PAYMENTS"
    | "CREDIT_CARD_STATEMENT_LINKS"

export type ImportBatchUndoCheck = {
    batchId: string

    status:
    ImportBatchStatus

    importedCount:
    number

    currentTransactionCount:
    number

    modifiedTransactionCount:
    number

    classifiedTransactionCount:
    number

    transferTransactionCount:
    number

    allocationCount:
    number

    attachmentCount:
    number

    receiptCount:
    number

    creditCardPaymentCount:
    number

    creditCardStatementLinkCount:
    number

    canUndo:
    boolean

    blockers:
    ImportBatchUndoBlocker[]
}

export type ImportBatchUndoResponse = {
    batchId: string
    deletedTransactionCount: number
    status: ImportBatchStatus
    undoneAt: string
}