package com.fluxfund.api.domain.financialtransaction.dto;

import java.util.List;
import java.util.UUID;

import com.fluxfund.api.domain.category.dto.CategorySummaryResponse;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionType;

public record FinancialTransactionClassificationSuggestionResponse(
        boolean available,
        String source,
        UUID basedOnTransactionId,
        FinancialTransactionType type,
        CategorySummaryResponse category,
        String description,
        List<ClassificationSuggestionAllocationResponse> allocations
) {
    public static FinancialTransactionClassificationSuggestionResponse unavailable() {
        return new FinancialTransactionClassificationSuggestionResponse(
                false,
                null,
                null,
                null,
                null,
                null,
                List.of());
    }
}