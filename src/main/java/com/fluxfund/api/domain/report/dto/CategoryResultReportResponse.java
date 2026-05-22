package com.fluxfund.api.domain.report.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record CategoryResultReportResponse(
        LocalDate startDate,
        LocalDate endDate,
        BigDecimal incomeTotal,
        BigDecimal expenseTotal,
        BigDecimal netTotal,
        List<CategoryResultItemResponse> items
) {
}