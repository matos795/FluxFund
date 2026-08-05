package com.fluxfund.api.domain.financialparty.dto;

import java.math.BigDecimal;

public record FinancialPartyOverviewSummaryResponse(

        BigDecimal receivedFromParty,
        BigDecimal destinedToParty,
        BigDecimal paidToParty,
        long transactionCount,
        long activeCommitmentCount,
        long activeSupportAgreementCount,
        long issuedReceiptCount,
        BigDecimal issuedReceiptAmount) {
}