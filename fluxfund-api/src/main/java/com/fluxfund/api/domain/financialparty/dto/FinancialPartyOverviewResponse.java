package com.fluxfund.api.domain.financialparty.dto;

import java.util.List;

import com.fluxfund.api.domain.beneficiary.dto.BeneficiaryResponse;
import com.fluxfund.api.domain.financialcommitment.dto.FinancialCommitmentResponse;
import com.fluxfund.api.domain.receipt.dto.ReceiptResponse;
import com.fluxfund.api.domain.supportagreement.dto.SupportAgreementResponse;

public record FinancialPartyOverviewResponse(

        BeneficiaryResponse party,
        FinancialPartyOverviewSummaryResponse summary,
        List<FinancialPartyActivityResponse> recentActivities,
        List<FinancialCommitmentResponse> commitments,
        List<SupportAgreementResponse> supportAgreements,
        List<ReceiptResponse> receipts) {
}