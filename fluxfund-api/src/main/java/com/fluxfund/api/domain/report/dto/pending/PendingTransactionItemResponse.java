package com.fluxfund.api.domain.report.dto.pending;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record PendingTransactionItemResponse(
        UUID id,
        LocalDate date,
        String description,
        String rawDescription,
        String accountName,
        String categoryName,
        BigDecimal amount,
        String reason
) {
}