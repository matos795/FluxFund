package com.fluxfund.api.domain.report.dto.pending;

import java.math.BigDecimal;
import java.util.UUID;

public record PendingFundResponse(
        UUID id,
        String name,
        BigDecimal currentBalance,
        String reason
) {
}