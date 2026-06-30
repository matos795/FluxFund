package com.fluxfund.api.domain.report.dto.accountability;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record AccountabilityByAccountItemResponse(
        UUID beneficiaryId,
        String beneficiaryName,
        UUID fundId,
        String fundName,

        BigDecimal openingPendingAmount,

        BigDecimal allocatedAmount,
        BigDecimal transferredAmount,
        BigDecimal commitmentAmount,
        BigDecimal payableAmount,

        BigDecimal pendingAmount,

        long allocationCount,
        List<AccountabilityAccountBreakdownResponse> accounts
) {
}