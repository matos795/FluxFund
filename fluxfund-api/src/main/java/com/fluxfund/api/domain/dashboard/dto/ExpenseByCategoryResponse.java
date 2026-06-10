package com.fluxfund.api.domain.dashboard.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record ExpenseByCategoryResponse(
        UUID categoryId,
        String categoryName,
        BigDecimal amount,
        BigDecimal percentage
) {
}