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
    enforcementEnabled: boolean
    acceptanceRequired: boolean
    termsVersion: string
    privacyNoticeVersion: string
    acceptedAt: string | null
}

export type AcceptLegalDocumentsRequest = {
    termsAccepted: boolean
    privacyNoticeAcknowledged: boolean
}