package com.fluxfund.api.domain.financialtransaction.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.UUID;

import com.fluxfund.api.domain.financialtransaction.FinancialTransactionSource;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionStatus;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionType;

public record FinancialTransactionResponse(
    UUID id,

    UUID accountId,

    UUID categoryId,

    FinancialTransactionType type,
    FinancialTransactionSource source,
    FinancialTransactionStatus status,

    String externalId,

    LocalDate dueDate,
    LocalDate settlementDate,

    BigDecimal expectedAmount,
    BigDecimal settledAmount,

    BigDecimal interestAmount,
    BigDecimal discountAmount,

    String description,
    String rawDescription,
    String documentNumber,

    LocalDateTime importedAt,
    LocalDateTime classifiedAt,

    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {

}
