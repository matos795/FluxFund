export type LegalDocument = {
    version: string
    hash: string
    content: string
}

export type LegalDocumentsResponse = {
    terms: LegalDocument
    privacyNotice: LegalDocument
}

export type LegalAcceptanceStatus = {
    acceptanceRequired: boolean
    termsVersion: string
    privacyNoticeVersion: string
}

export type AcceptLegalDocumentsRequest = {
    termsAccepted: boolean
    privacyNoticeAcknowledged: boolean
}