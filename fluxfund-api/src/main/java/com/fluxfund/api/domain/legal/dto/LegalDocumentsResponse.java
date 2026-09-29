package com.fluxfund.api.domain.legal.dto;

public record LegalDocumentsResponse(
        LegalDocumentResponse terms,
        LegalDocumentResponse privacyNotice) {
}