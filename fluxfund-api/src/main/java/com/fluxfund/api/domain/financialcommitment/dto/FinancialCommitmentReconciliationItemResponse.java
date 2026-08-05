package com.fluxfund.api.domain.financialcommitment.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.fluxfund.api.domain.beneficiary.dto.FinancialPartySummaryResponse;
import com.fluxfund.api.domain.financialcommitment.FinancialCommitmentReconciliationStatus;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionType;
import com.fluxfund.api.domain.fund.dto.FundSummaryResponse;

public record FinancialCommitmentReconciliationItemResponse(

        UUID allocationId,

        UUID transactionId,

        LocalDate settlementDate,

        String description,

        FinancialTransactionType transactionType,

        String accountName,

        FundSummaryResponse fund,

        FinancialPartySummaryResponse sourceParty,

        FinancialPartySummaryResponse recipientParty,

        LocalDate referenceMonth,

        BigDecimal amount,

        FinancialCommitmentReconciliationStatus matchStatus,

        List<FinancialCommitmentAllocationSuggestionResponse> suggestions) {
}