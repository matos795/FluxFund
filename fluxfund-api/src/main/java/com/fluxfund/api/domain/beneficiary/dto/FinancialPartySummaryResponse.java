package com.fluxfund.api.domain.beneficiary.dto;

import java.util.Set;
import java.util.UUID;

import com.fluxfund.api.domain.beneficiary.BeneficiaryType;
import com.fluxfund.api.domain.beneficiary.FinancialPartyRole;
import com.fluxfund.api.domain.beneficiary.FinancialPartyType;

public record FinancialPartySummaryResponse(

        UUID id,
        String name,
        FinancialPartyType partyType,
        BeneficiaryType classification,
        Set<FinancialPartyRole> roles,
        String document
) {
}