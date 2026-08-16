package com.fluxfund.api.domain.creditcardstatement.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

import com.fluxfund.api.domain.creditcardstatement.CreditCardStatementStatus;

public record CreditCardStatementLibraryResponse(
        UUID id,
        UUID accountId,
        String accountName,
        String statementName,
        LocalDate closingDate,
        LocalDate dueDate,
        CreditCardStatementStatus status,
        String originalFilename,
        String contentType,
        Long sizeBytes,
        OffsetDateTime uploadedAt
) {
}