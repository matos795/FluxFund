package com.fluxfund.api.domain.dashboard.dto;

import java.math.BigDecimal;
import java.util.UUID;

public interface ExpenseByCategoryProjection {
    UUID getCategoryId();
    String getCategoryName();
    BigDecimal getAmount();
}