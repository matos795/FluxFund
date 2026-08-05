package com.fluxfund.api.domain.transactionallocation.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

import com.fluxfund.api.domain.beneficiary.dto.BeneficiarySummaryResponse;
import com.fluxfund.api.domain.beneficiary.dto.FinancialPartySummaryResponse;
import com.fluxfund.api.domain.financialcommitment.dto.FinancialCommitmentAllocationSummaryResponse;
import com.fluxfund.api.domain.fund.dto.FundSummaryResponse;

public record TransactionAllocationResponse(
        UUID id,
        UUID financialTransactionId,
        FundSummaryResponse fund,
        BeneficiarySummaryResponse beneficiary,
        FinancialPartySummaryResponse sourceParty,
        FinancialPartySummaryResponse recipientParty,
        FinancialCommitmentAllocationSummaryResponse financialCommitment,
        BigDecimal amount,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt,
        LocalDate referenceMonth) {
}