package com.fluxfund.api.domain.fund.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record FundOptionResponse(
        UUID id,
        String label,
        BigDecimal currentBalance
) {
}