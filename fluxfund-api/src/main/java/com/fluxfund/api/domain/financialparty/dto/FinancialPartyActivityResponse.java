package com.fluxfund.api.domain.financialparty.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;

import com.fluxfund.api.domain.financialcommitment.dto.FinancialCommitmentAllocationSummaryResponse;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionType;

public record FinancialPartyActivityResponse(

        UUID allocationId,
        UUID transactionId,
        FinancialTransactionType transactionType,
        LocalDate settlementDate,
        String description,
        String accountName,
        String fundName,
        BigDecimal amount,
        LocalDate referenceMonth,
        Set<FinancialPartyActivityRole> roles,
        FinancialCommitmentAllocationSummaryResponse financialCommitment) {
}