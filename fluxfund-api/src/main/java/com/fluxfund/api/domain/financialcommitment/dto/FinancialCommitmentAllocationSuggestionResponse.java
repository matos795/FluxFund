package com.fluxfund.api.domain.financialcommitment.dto;

import java.math.BigDecimal;

public record FinancialCommitmentAllocationSuggestionResponse(

        FinancialCommitmentAllocationSummaryResponse commitment,
        BigDecimal realizedAmount,
        BigDecimal remainingAmount,
        BigDecimal suggestedAmount,
        boolean exactFundMatch,
        boolean fulfilled) {
}