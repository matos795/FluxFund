package com.fluxfund.api.domain.dashboard.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public interface DashboardTransactionActionItemProjection {
    UUID getTransactionId();
    LocalDate getSettlementDate();
    String getDescription();
    String getRawDescription();
    String getAccountName();
    String getCategoryName();
    BigDecimal getAmount();
}