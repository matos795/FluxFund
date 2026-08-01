package com.fluxfund.api.domain.supportagreement.mapper;

import java.time.LocalDate;

import com.fluxfund.api.domain.beneficiary.mapper.BeneficiaryMapper;
import com.fluxfund.api.domain.financialcommitment.FinancialCommitment;
import com.fluxfund.api.domain.fund.mapper.FundMapper;
import com.fluxfund.api.domain.supportagreement.SupportAgreementStatus;
import com.fluxfund.api.domain.supportagreement.dto.SupportAgreementResponse;

public final class SupportAgreementMapper {

    private SupportAgreementMapper() {
    }

    public static SupportAgreementResponse
            toResponse(
                    FinancialCommitment commitment) {

        return toResponse(
                commitment,
                LocalDate.now());
    }

    public static SupportAgreementResponse
            toResponse(

                    FinancialCommitment commitment,

                    LocalDate referenceDate) {

        SupportAgreementStatus status =
                SupportAgreementStatus.valueOf(

                        commitment
                                .resolveStatusAt(
                                        referenceDate)

                                .name());

        return new SupportAgreementResponse(

                commitment.getId(),

                commitment
                        .getOrganization()
                        .getId(),

                BeneficiaryMapper
                        .toSummaryResponse(
                                commitment
                                        .getParty()),

                FundMapper
                        .toSummaryResponse(
                                commitment
                                        .getFund()),
                commitment.getAmount(),
                commitment.getStartDate(),
                commitment.getEndDate(),
                status,
                commitment.getActive(),
                commitment.getDescription(),
                commitment.getCreatedAt(),
                commitment.getUpdatedAt());
    }
}