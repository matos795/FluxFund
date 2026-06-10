package com.fluxfund.api.domain.dashboard.dto;

import java.math.BigDecimal;
import java.util.UUID;

public interface FundOverviewProjection {
    UUID getFundId();
    String getFundName();
    BigDecimal getInitialBalance();
    BigDecimal getCurrentMovement();
    BigDecimal getIncomeAllocated();
    BigDecimal getExpenseAllocated();
}