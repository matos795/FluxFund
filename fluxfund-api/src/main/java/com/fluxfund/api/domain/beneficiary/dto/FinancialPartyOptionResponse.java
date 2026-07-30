package com.fluxfund.api.domain.beneficiary.dto;

import java.util.Set;
import java.util.UUID;

import com.fluxfund.api.domain.beneficiary.BeneficiaryType;
import com.fluxfund.api.domain.beneficiary.FinancialPartyRole;
import com.fluxfund.api.domain.beneficiary.FinancialPartyType;

public record FinancialPartyOptionResponse(

        UUID id,
        String label,
        FinancialPartyType partyType,
        BeneficiaryType classification,
        Set<FinancialPartyRole> roles,
        String document
) {
}