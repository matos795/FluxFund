package com.fluxfund.api.domain.dashboard.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record DashboardFundActionItemResponse(
        UUID fundId,
        String fundName,
        BigDecimal currentBalance
) {
}