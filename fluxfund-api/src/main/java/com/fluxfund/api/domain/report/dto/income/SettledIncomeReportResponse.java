package com.fluxfund.api.domain.report.dto.income;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import com.fluxfund.api.domain.report.dto.category.CategoryResultItemResponse;

public record SettledIncomeReportResponse(
        LocalDate startDate,
        LocalDate endDate,
        BigDecimal totalReceivedAmount,
        long transactionCount,
        List<CategoryResultItemResponse> categoryItems,
        List<SettledIncomeReportItemResponse> items
) {
}