package com.fluxfund.api.domain.creditcardstatement.dto;

public record CreditCardStatementDocumentFile(
        String filename,
        String contentType,
        byte[] content
) {
}