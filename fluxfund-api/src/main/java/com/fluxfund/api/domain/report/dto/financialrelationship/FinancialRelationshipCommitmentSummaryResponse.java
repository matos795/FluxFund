package com.fluxfund.api.domain.report.dto.financialrelationship;

import java.math.BigDecimal;

public record FinancialRelationshipCommitmentSummaryResponse(

        BigDecimal expectedDueAmount,
        BigDecimal realizedAmount,
        BigDecimal coveredExpectedAmount,
        BigDecimal pendingAmount,
        BigDecimal exceededAmount,
        BigDecimal fulfillmentPercentage,
        long dueOccurrenceCount,
        long fulfilledOccurrenceCount,
        long partialOccurrenceCount,
        long pendingOccurrenceCount,
        long exceededOccurrenceCount
) {
}