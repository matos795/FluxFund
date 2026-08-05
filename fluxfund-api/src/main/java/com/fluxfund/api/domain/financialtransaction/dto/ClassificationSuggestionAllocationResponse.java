package com.fluxfund.api.domain.financialtransaction.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.fluxfund.api.domain.beneficiary.dto.BeneficiarySummaryResponse;
import com.fluxfund.api.domain.beneficiary.dto.FinancialPartySummaryResponse;
import com.fluxfund.api.domain.fund.dto.FundSummaryResponse;

public record ClassificationSuggestionAllocationResponse(
                FundSummaryResponse fund,
                BeneficiarySummaryResponse beneficiary,
                FinancialPartySummaryResponse sourceParty,
                FinancialPartySummaryResponse recipientParty,
                BigDecimal amount,
                LocalDate referenceMonth,
                String source) {
}