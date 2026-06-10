package com.fluxfund.api.domain.dashboard.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record FundOverviewResponse(
        UUID fundId,
        String fundName,
        BigDecimal currentBalance,
        BigDecimal incomeAllocated,
        BigDecimal expenseAllocated,
        BigDecimal periodBalance
) {
}