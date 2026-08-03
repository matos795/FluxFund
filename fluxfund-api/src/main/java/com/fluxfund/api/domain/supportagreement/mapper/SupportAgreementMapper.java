package com.fluxfund.api.domain.supportagreement.mapper;

import java.time.LocalDate;

import com.fluxfund.api.domain.beneficiary.mapper.BeneficiaryMapper;
import com.fluxfund.api.domain.fund.mapper.FundMapper;
import com.fluxfund.api.domain.supportagreement.SupportAgreement;
import com.fluxfund.api.domain.supportagreement.dto.SupportAgreementResponse;

public class SupportAgreementMapper {

    private SupportAgreementMapper() {
    }

    public static SupportAgreementResponse toResponse(
            SupportAgreement agreement) {

        return toResponse(agreement, LocalDate.now());
    }

    public static SupportAgreementResponse toResponse(
            SupportAgreement agreement,
            LocalDate referenceDate) {

        return new SupportAgreementResponse(
                agreement.getId(),
                agreement.getOrganization().getId(),
                BeneficiaryMapper.toSummaryResponse(
                        agreement.getBeneficiary()),
                FundMapper.toSummaryResponse(
                        agreement.getFund()),
                agreement.getAmount(),
                agreement.getStartDate(),
                agreement.getEndDate(),
                agreement.resolveStatusAt(referenceDate),
                agreement.getActive(),
                agreement.getDescription(),
                agreement.getCreatedAt(),
                agreement.getUpdatedAt()
        );
    }
}