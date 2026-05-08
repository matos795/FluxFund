package com.fluxfund.api.domain.fund.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record FundResponse(
    UUID id,
    UUID organizationId,
    String name,
    String description,
    BigDecimal initialBalance,
    LocalDate initialBalanceDate,
    BigDecimal currentBalance,
    boolean active,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {

}
