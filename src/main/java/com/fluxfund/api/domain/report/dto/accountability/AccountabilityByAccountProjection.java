package com.fluxfund.api.domain.report.dto.accountability;

import java.math.BigDecimal;
import java.util.UUID;

public record AccountabilityByAccountProjection(
        UUID beneficiaryId,
        String beneficiaryName,
        UUID fundId,
        String fundName,
        UUID accountId,
        String accountName,
        String bankName,
        BigDecimal allocatedAmount,
        BigDecimal transferredAmount,
        long allocationCount
) {
}