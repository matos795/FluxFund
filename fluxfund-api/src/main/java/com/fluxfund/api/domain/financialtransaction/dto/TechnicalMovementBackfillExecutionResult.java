package com.fluxfund.api.domain.financialtransaction.dto;

public record TechnicalMovementBackfillExecutionResult(

        int structuralCandidatePairs,
        int confirmedPairs,
        int transactionsMarked) {
}