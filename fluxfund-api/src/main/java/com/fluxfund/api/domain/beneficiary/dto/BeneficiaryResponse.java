package com.fluxfund.api.domain.beneficiary.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

import com.fluxfund.api.domain.beneficiary.BeneficiaryType;

public record BeneficiaryResponse(
    UUID id,
    String name,
    BeneficiaryType type,
    String document,
    String email,
    String phone,
    boolean active,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {

}
