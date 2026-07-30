package com.fluxfund.api.domain.beneficiary.dto;

import java.time.OffsetDateTime;
import java.util.Set;
import java.util.UUID;

import com.fluxfund.api.domain.beneficiary.BeneficiaryType;
import com.fluxfund.api.domain.beneficiary.FinancialPartyRole;
import com.fluxfund.api.domain.beneficiary.FinancialPartyType;

public record BeneficiaryResponse(

        UUID id,

        String name,

        BeneficiaryType type,

        FinancialPartyType partyType,

        Set<FinancialPartyRole> roles,

        String document,

        String email,

        String phone,

        String legalName,

        String contactPerson,

        String addressLine,

        String addressNumber,

        String addressComplement,

        String neighborhood,

        String city,

        String state,

        String zipCode,

        String notes,

        boolean active,

        OffsetDateTime createdAt,

        OffsetDateTime updatedAt) {
}