package com.fluxfund.api.domain.financialtransaction.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record TechnicalMovementBackfillPreviewItem(

        UUID fundingTransactionId,
        UUID reversalTransactionId,
        UUID accountId,
        LocalDate settlementDate,
        BigDecimal amount,
        boolean fundingAlreadyTechnical,
        boolean reversalAlreadyTechnical) {
}