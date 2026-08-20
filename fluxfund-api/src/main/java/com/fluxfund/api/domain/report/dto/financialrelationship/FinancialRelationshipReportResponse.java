package com.fluxfund.api.domain.report.dto.financialrelationship;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record FinancialRelationshipReportResponse(

        LocalDate startDate,
        LocalDate endDate,
        int monthCount,
        BigDecimal receivedFromPartiesTotal,
        BigDecimal paidToPartiesTotal,
        int incomeSourceCount,
        int paymentRecipientCount,
        int uniqueRelationshipCount,
        BigDecimal topFiveIncomeConcentrationPercentage,
        BigDecimal topFivePaymentConcentrationPercentage,
        FinancialRelationshipCommitmentSummaryResponse commitmentReliability,
        List<FinancialRelationshipMonthResponse> months,
        List<FinancialRelationshipPartySummaryResponse> incomeSources,
        List<FinancialRelationshipPartySummaryResponse> paymentRecipients
) {
}