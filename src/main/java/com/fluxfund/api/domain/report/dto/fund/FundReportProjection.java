package com.fluxfund.api.domain.report.dto.fund;

import java.math.BigDecimal;
import java.util.UUID;

public record FundReportProjection(
        UUID fundId,
        String fundName,
        BigDecimal initialBalance,
        BigDecimal incomeAllocated,
        BigDecimal expenseAllocated,
        BigDecimal historicalAllocationBalance,
        Long allocationCount
) {
}