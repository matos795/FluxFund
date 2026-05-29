package com.fluxfund.api.domain.account.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

import com.fluxfund.api.domain.account.AccountType;

public record AccountResponse(

        UUID id,
        String name,
        AccountType type,
        String bankCode,
        String bankName,
        String agency,
        String accountNumber,
        BigDecimal initialBalance,
        boolean active,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
}