package com.fluxfund.api.domain.report.dto.expense;

import java.math.BigDecimal;
import java.time.LocalDate;

public record SettledExpenseReportItemResponse(
        LocalDate settlementDate,
        String description,
        String categoryName,
        String accountName,
        BigDecimal amount
) {
}