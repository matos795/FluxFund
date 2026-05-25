package com.fluxfund.api.domain.report.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record FundReportItemResponse(
        UUID fundId,
        String fundName,
        BigDecimal initialBalance,
        BigDecimal incomeAllocated,
        BigDecimal expenseAllocated,
        BigDecimal periodBalance,
        BigDecimal currentBalance,
        long allocationCount
) {
}