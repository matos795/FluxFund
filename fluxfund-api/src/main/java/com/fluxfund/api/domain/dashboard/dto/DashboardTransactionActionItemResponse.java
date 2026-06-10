package com.fluxfund.api.domain.dashboard.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record DashboardTransactionActionItemResponse(
        UUID transactionId,
        LocalDate settlementDate,
        String description,
        String rawDescription,
        String accountName,
        String categoryName,
        BigDecimal amount
) {
}