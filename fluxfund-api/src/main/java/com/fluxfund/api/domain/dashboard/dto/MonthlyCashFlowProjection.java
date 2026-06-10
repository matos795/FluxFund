package com.fluxfund.api.domain.dashboard.dto;

import java.math.BigDecimal;

public interface MonthlyCashFlowProjection {
    String getMonth();
    BigDecimal getIncome();
    BigDecimal getExpense();
}