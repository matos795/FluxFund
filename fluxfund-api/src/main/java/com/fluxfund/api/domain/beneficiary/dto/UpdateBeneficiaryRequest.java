package com.fluxfund.api.domain.beneficiary.dto;

import java.util.Set;

import com.fluxfund.api.domain.beneficiary.BeneficiaryType;
import com.fluxfund.api.domain.beneficiary.FinancialPartyRole;
import com.fluxfund.api.domain.beneficiary.FinancialPartyType;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public record UpdateBeneficiaryRequest(

        @Size(max = 100) String name,

        BeneficiaryType type,

        FinancialPartyType partyType,

        Set<FinancialPartyRole> roles,

        @Size(max = 30) String document,

        @Email @Size(max = 255) String email,

        @Size(max = 30) String phone,

        @Size(max = 255) String legalName,

        @Size(max = 255) String contactPerson,

        @Size(max = 255) String addressLine,

        @Size(max = 50) String addressNumber,

        @Size(max = 255) String addressComplement,

        @Size(max = 255) String neighborhood,

        @Size(max = 255) String city,

        @Size(max = 2) String state,

        @Size(max = 9) String zipCode,

        @Size(max = 2000) String notes) {
}