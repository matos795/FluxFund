package com.fluxfund.api.domain.report.dto.income;

import java.math.BigDecimal;
import java.time.LocalDate;

public record SettledIncomeReportItemResponse(
        LocalDate settlementDate,
        String description,
        String categoryName,
        String accountName,
        BigDecimal amount
) {
}