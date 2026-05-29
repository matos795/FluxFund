package com.fluxfund.api.domain.supportagreement.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

import com.fluxfund.api.domain.beneficiary.dto.BeneficiarySummaryResponse;
import com.fluxfund.api.domain.fund.dto.FundSummaryResponse;

public record SupportAgreementResponse(
        UUID id,
        UUID organizationId,
        BeneficiarySummaryResponse beneficiary,
        FundSummaryResponse fund,
        BigDecimal amount,
        LocalDate startDate,
        LocalDate endDate,
        Boolean active,
        String description,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
}