package com.fluxfund.api.domain.bankstatementdocument.dto;

public record BankStatementDocumentFile(
        String filename,
        String contentType,
        byte[] content
) {
}