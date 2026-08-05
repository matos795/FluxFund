package com.fluxfund.api.domain.financialcommitment.mapper;

import java.time.LocalDate;

import com.fluxfund.api.domain.beneficiary.mapper.BeneficiaryMapper;
import com.fluxfund.api.domain.financialcommitment.FinancialCommitment;
import com.fluxfund.api.domain.financialcommitment.dto.FinancialCommitmentAllocationSummaryResponse;
import com.fluxfund.api.domain.financialcommitment.dto.FinancialCommitmentResponse;
import com.fluxfund.api.domain.fund.mapper.FundMapper;

public final class FinancialCommitmentMapper {

    private FinancialCommitmentMapper() {
    }

    public static FinancialCommitmentResponse toResponse(FinancialCommitment commitment) {
        return toResponse(commitment, LocalDate.now());
    }

    public static FinancialCommitmentResponse toResponse(FinancialCommitment commitment, LocalDate referenceDate) {

        return new FinancialCommitmentResponse(
                commitment.getId(),
                commitment.getOrganization().getId(),
                BeneficiaryMapper.toFinancialPartySummaryResponse(commitment.getParty()),
                BeneficiaryMapper.toFinancialPartySummaryResponse(commitment.getDesignatedRecipient()),
                FundMapper.toSummaryResponse(commitment.getFund()),
                commitment.getDirection(),
                commitment.getCommitmentType(),
                commitment.getRecurrence(),
                commitment.getAmount(),
                commitment.getDueDay(),
                commitment.getStartDate(),
                commitment.getEndDate(),
                commitment.resolveStatusAt(referenceDate),
                commitment.getActive(),
                commitment.getDescription(),
                commitment.getCreatedAt(),
                commitment.getUpdatedAt());
    }

    public static FinancialCommitmentAllocationSummaryResponse toAllocationSummary(
            FinancialCommitment commitment) {

        if (commitment == null) {
            return null;
        }

        return new FinancialCommitmentAllocationSummaryResponse(
                commitment.getId(),
                commitment.getDirection(),
                commitment.getCommitmentType(),
                commitment.getRecurrence(),
                commitment.getAmount(),
                commitment.getDueDay(),
                commitment.getStartDate(),
                commitment.getEndDate(),
                BeneficiaryMapper.toFinancialPartySummaryResponse(commitment.getParty()),
                BeneficiaryMapper.toFinancialPartySummaryResponse(commitment.getDesignatedRecipient()),
                FundMapper.toSummaryResponse(commitment.getFund()),
                commitment.getActive());
    }
}