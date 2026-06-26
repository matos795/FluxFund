package com.fluxfund.api.domain.creditcardstatement.dto;

import java.time.OffsetDateTime;

public record CreditCardStatementDocumentResponse(
        String originalFilename,
        String contentType,
        Long sizeBytes,
        OffsetDateTime uploadedAt
) {
}