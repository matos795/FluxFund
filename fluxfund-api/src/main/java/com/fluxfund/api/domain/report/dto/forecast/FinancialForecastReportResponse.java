package com.fluxfund.api.domain.report.dto.forecast;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record FinancialForecastReportResponse(

        LocalDate startMonth,

        LocalDate endMonth,

        int monthCount,

        boolean includesSupport,

        BigDecimal receivableTotal,

        BigDecimal genericPayableTotal,

        BigDecimal supportTotal,

        BigDecimal payableTotal,

        BigDecimal netTotal,

        BigDecimal lowestCumulativeNet,

        LocalDate lowestCumulativeMonth,

        List<FinancialForecastMonthResponse> months
) {
}