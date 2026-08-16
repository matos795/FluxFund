package com.fluxfund.api.domain.dashboard.dto;

import java.math.BigDecimal;

public interface DashboardCashFlowTotalsProjection {

    BigDecimal getIncome();

    BigDecimal getExpense();
}