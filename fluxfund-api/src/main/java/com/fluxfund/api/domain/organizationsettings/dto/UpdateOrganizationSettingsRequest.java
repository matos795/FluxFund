package com.fluxfund.api.domain.organizationsettings.dto;

import java.time.LocalDate;
import java.util.UUID;

import jakarta.validation.constraints.PastOrPresent;

public record UpdateOrganizationSettingsRequest(
        UUID defaultFundId,
        Boolean allowNegativeFunds,
        Boolean suggestDefaultFundReallocation,
        Boolean requireFiscalDocumentForExpenses,
        Boolean requireProofForIncomes,
        Boolean autoFillClassificationSuggestions,

        @PastOrPresent(message = "A data de início do histórico não pode estar no futuro.")
        LocalDate accountabilityHistoryStartDate
) {
}