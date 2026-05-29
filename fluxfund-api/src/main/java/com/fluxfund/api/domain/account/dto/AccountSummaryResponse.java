package com.fluxfund.api.domain.account.dto;

import java.util.UUID;

import com.fluxfund.api.domain.account.AccountType;

public record AccountSummaryResponse(
    UUID id,
    String name,
    AccountType type,
    String bankName
) {
}