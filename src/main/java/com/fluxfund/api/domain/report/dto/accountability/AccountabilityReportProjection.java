package com.fluxfund.api.domain.report.dto.accountability;

import java.math.BigDecimal;
import java.util.UUID;

public record AccountabilityReportProjection(
        UUID beneficiaryId,
        String beneficiaryName,
        UUID fundId,
        String fundName,
        BigDecimal allocatedAmount,
        BigDecimal transferredAmount,
        long allocationCount
) {
}