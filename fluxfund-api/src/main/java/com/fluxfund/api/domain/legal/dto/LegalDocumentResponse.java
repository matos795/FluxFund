package com.fluxfund.api.domain.legal.dto;

public record LegalDocumentResponse(
        String version,
        String hash,
        String content) {
}