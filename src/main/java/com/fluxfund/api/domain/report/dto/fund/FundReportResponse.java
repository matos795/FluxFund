package com.fluxfund.api.domain.report.dto.fund;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record FundReportResponse(
        LocalDate startDate,
        LocalDate endDate,
        BigDecimal fundsTotalBalance,
        BigDecimal incomeAllocatedTotal,
        BigDecimal expenseAllocatedTotal,
        long negativeFundsCount,
        List<FundReportItemResponse> items
) {
}