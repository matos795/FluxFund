package com.fluxfund.api.domain.dashboard.dto;

import java.math.BigDecimal;

public record MonthlyCashFlowResponse(
        String month,
        String label,
        BigDecimal income,
        BigDecimal expense,
        BigDecimal net
) {
}