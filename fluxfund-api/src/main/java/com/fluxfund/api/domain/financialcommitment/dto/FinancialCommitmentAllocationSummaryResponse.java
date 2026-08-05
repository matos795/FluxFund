package com.fluxfund.api.domain.financialcommitment.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import com.fluxfund.api.domain.beneficiary.dto.FinancialPartySummaryResponse;
import com.fluxfund.api.domain.financialcommitment.FinancialCommitmentDirection;
import com.fluxfund.api.domain.financialcommitment.FinancialCommitmentRecurrence;
import com.fluxfund.api.domain.financialcommitment.FinancialCommitmentType;
import com.fluxfund.api.domain.fund.dto.FundSummaryResponse;

public record FinancialCommitmentAllocationSummaryResponse(

        UUID id,
        FinancialCommitmentDirection direction,
        FinancialCommitmentType commitmentType,
        FinancialCommitmentRecurrence recurrence,
        BigDecimal amount,
        Integer dueDay,
        LocalDate startDate,
        LocalDate endDate,
        FinancialPartySummaryResponse party,
        FinancialPartySummaryResponse designatedRecipient,
        FundSummaryResponse plannedFund,
        Boolean active
) {
}