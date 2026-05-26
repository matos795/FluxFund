package com.fluxfund.api.domain.report.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record AccountabilityReportItemResponse(
        UUID beneficiaryId,
        String beneficiaryName,
        UUID fundId,
        String fundName,
        BigDecimal allocatedAmount,
        BigDecimal transferredAmount,
        BigDecimal pendingAmount,
        long allocationCount
) {
}