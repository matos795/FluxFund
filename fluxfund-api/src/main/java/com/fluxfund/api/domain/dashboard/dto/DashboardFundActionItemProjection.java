package com.fluxfund.api.domain.dashboard.dto;

import java.math.BigDecimal;
import java.util.UUID;

public interface DashboardFundActionItemProjection {
    UUID getFundId();
    String getFundName();
    BigDecimal getCurrentBalance();
}