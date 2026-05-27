package com.fluxfund.api.domain.report.dto.accountability;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record AccountabilityByAccountReportResponse(
        LocalDate startDate,
        LocalDate endDate,
        BigDecimal allocatedTotal,
        BigDecimal transferredTotal,
        BigDecimal pendingTotal,
        long beneficiariesWithPendingBalance,
        List<AccountabilityByAccountItemResponse> items
) {
}