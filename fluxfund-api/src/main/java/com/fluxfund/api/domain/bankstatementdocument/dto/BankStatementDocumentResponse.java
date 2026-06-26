package com.fluxfund.api.domain.bankstatementdocument.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record BankStatementDocumentResponse(

        UUID id,
        UUID accountId,
        String accountName,
        LocalDate periodStartDate,
        LocalDate periodEndDate,
        String originalFilename,
        String contentType,
        Long sizeBytes,
        OffsetDateTime uploadedAt,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt) {
}