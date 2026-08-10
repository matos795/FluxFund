package com.fluxfund.api.domain.financialtransaction.dto;

public record ClassificationSuggestionEvidenceResponse(

        int historyCount,

        int categoryMatchCount,

        int categoryAgreementPercent,

        int allocationHistoryCount,

        int allocationMatchCount,

        int allocationAgreementPercent

) {
}