package com.fluxfund.api.domain.report.dto.forecast;

import java.math.BigDecimal;
import java.time.LocalDate;

public record FinancialForecastMonthResponse(

        LocalDate referenceMonth,

        BigDecimal receivableAmount,

        BigDecimal genericPayableAmount,

        BigDecimal supportAmount,

        BigDecimal payableAmount,

        BigDecimal netAmount,

        BigDecimal cumulativeNetAmount,

        long receivableCount,

        long genericPayableCount,

        long supportCount
) {
}