package com.fluxfund.api.domain.beneficiary.dto;

import com.fluxfund.api.domain.beneficiary.BeneficiaryType;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public record UpdateBeneficiaryRequest(
    @Size(max = 100)
    String name,
    BeneficiaryType type,
    @Size(max = 30)
    String document,
    @Email
    @Size(max = 255)
    String email,
    @Size(max = 30)
    String phone,
    Boolean active
) {

}
