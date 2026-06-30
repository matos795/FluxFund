package com.fluxfund.api.domain.report.dto.expense;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import com.fluxfund.api.domain.report.dto.category.CategoryResultItemResponse;

public record SettledExpenseReportResponse(
        LocalDate startDate,
        LocalDate endDate,
        BigDecimal totalPaidAmount,
        long transactionCount,
        List<CategoryResultItemResponse> categoryItems,
        List<SettledExpenseReportItemResponse> items
) {
}