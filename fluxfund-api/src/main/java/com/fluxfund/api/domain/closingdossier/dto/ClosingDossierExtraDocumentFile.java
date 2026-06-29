package com.fluxfund.api.domain.closingdossier.dto;

public record ClosingDossierExtraDocumentFile(
        String filename,
        String contentType,
        byte[] content
) {
}