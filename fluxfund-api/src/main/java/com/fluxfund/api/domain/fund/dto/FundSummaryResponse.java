package com.fluxfund.api.domain.fund.dto;

import java.util.UUID;

public record FundSummaryResponse(
    UUID id,
    String name
) {
}