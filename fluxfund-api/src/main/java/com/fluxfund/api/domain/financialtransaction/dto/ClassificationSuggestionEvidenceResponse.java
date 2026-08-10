package com.fluxfund.api.domain.financialtransaction.dto;

import java.time.LocalDate;
import java.util.List;

public record ClassificationSuggestionEvidenceResponse(

        int historyCount,

        int categoryMatchCount,

        int categoryAgreementPercent,

        int allocationHistoryCount,

        int allocationMatchCount,

        int allocationAgreementPercent,

        List<LocalDate> historyDates,

        int documentPolicyHistoryCount,

        int documentPolicyMatchCount,

        int documentPolicyAgreementPercent

) {
}