package com.fluxfund.api.domain.report.dto.accountability;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record AccountabilityReportResponse(
        LocalDate startDate,
        LocalDate endDate,

        BigDecimal openingPendingTotal,

        BigDecimal allocatedTotal,
        BigDecimal transferredTotal,
        BigDecimal commitmentTotal,
        BigDecimal payableTotal,

        BigDecimal pendingTotal,

        long beneficiariesWithPendingBalance,
        List<AccountabilityReportItemResponse> items
) {
}