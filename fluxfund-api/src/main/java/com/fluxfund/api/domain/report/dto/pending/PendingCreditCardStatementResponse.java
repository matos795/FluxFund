package com.fluxfund.api.domain.report.dto.pending;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record PendingCreditCardStatementResponse(
        UUID id,
        String name,
        String accountName,
        String status,
        LocalDate dueDate,
        BigDecimal totalAmount,
        long pendingItemsCount,
        String reason
) {
}