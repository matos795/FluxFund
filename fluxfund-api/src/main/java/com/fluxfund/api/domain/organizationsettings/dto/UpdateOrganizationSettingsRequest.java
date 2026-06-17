package com.fluxfund.api.domain.organizationsettings.dto;

import java.util.UUID;

public record UpdateOrganizationSettingsRequest(
        UUID defaultFundId,
        Boolean allowNegativeFunds,
        Boolean suggestDefaultFundReallocation,
        Boolean requireFiscalDocumentForExpenses,
        Boolean requireProofForIncomes
) {
}