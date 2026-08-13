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