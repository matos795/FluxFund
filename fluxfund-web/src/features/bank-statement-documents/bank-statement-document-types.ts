export type BankStatementDocument = {
    id: string

    accountId: string
    accountName: string

    periodStartDate: string
    periodEndDate: string

    originalFilename: string
    contentType: string
    sizeBytes: number

    uploadedAt: string
    createdAt: string
    updatedAt: string | null
}

export type GetBankStatementDocumentsLibraryParams = {
    page?: number
    size?: number
}