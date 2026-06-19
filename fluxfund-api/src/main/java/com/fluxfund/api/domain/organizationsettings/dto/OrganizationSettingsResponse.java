package com.fluxfund.api.domain.organizationsettings.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

import com.fluxfund.api.domain.fund.dto.FundSummaryResponse;

public record OrganizationSettingsResponse(
                UUID id,
                UUID organizationId,
                FundSummaryResponse defaultFund,
                OffsetDateTime createdAt,
                OffsetDateTime updatedAt,
                Boolean allowNegativeFunds,
                Boolean suggestDefaultFundReallocation,
                Boolean requireFiscalDocumentForExpenses,
                Boolean requireProofForIncomes,
                Boolean autoFillClassificationSuggestions
        ) {
}