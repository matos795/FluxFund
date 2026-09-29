package com.fluxfund.api.domain.legal.dto;

public record LegalDocumentSnapshot(

        String version,
        String hash,
        String content) {
}