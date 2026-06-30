package com.fluxfund.api.domain.report.dto.fund;

import java.math.BigDecimal;
import java.util.UUID;

public record FundTransferPeriodProjection(
        UUID fundId,
        BigDecimal totalAmount
) {
}