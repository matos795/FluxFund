package com.fluxfund.api.domain.report.dto.financialcommitment;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import com.fluxfund.api.domain.financialcommitment.FinancialCommitmentDirection;

public record FinancialCommitmentMonthlyReportResponse(

        LocalDate referenceMonth,
        FinancialCommitmentDirection direction,
        BigDecimal expectedTotal,
        BigDecimal realizedTotal,
        BigDecimal pendingTotal,
        BigDecimal exceededTotal,
        long totalCommitments,
        long notDueCount,
        long pendingCount,
        long partialCount,
        long fulfilledCount,
        long exceededCount,
        List<FinancialCommitmentMonthlyItemResponse> items) {
}