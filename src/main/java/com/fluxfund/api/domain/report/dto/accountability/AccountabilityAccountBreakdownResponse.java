package com.fluxfund.api.domain.report.dto.accountability;

import java.math.BigDecimal;
import java.util.UUID;

public record AccountabilityAccountBreakdownResponse(
        UUID accountId,
        String accountName,
        String bankName,
        BigDecimal allocatedAmount,
        BigDecimal transferredAmount,
        BigDecimal pendingAmount,
        Long allocationCount
) {
}
