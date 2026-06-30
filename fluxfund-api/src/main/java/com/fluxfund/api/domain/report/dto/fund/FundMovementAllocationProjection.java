package com.fluxfund.api.domain.report.dto.fund;

import java.math.BigDecimal;
import java.util.UUID;

public record FundMovementAllocationProjection(
        UUID fundId,
        BigDecimal incomeAllocatedAmount,
        BigDecimal expenseAllocatedAmount,
        Long allocationCount
) {
}