package com.fluxfund.api.domain.beneficiary.dto;

import java.util.UUID;

import com.fluxfund.api.domain.beneficiary.BeneficiaryType;

public record BeneficiarySummaryResponse(
    UUID id,
    String name,
    BeneficiaryType type
) {
}