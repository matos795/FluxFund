package com.fluxfund.api.domain.financialtransaction.dto;

import java.util.List;

public record TechnicalMovementBackfillPreview(

        int structuralCandidatePairs,
        int confirmedPairs,
        int transactionsToMark,
        List<TechnicalMovementBackfillPreviewItem> pairs) {
}