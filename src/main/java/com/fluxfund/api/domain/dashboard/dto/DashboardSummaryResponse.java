package com.fluxfund.api.domain.dashboard.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DashboardSummaryResponse(
        LocalDate startDate,
        LocalDate endDate,

        BigDecimal incomeTotal,
        BigDecimal expenseTotal,
        BigDecimal netTotal,

        BigDecimal accountsTotalBalance,
        BigDecimal fundsTotalBalance,

        long transactionCount,
        long unclassifiedCount,
        long unallocatedCount
) {
}