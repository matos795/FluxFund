package com.fluxfund.api.domain.report.dto.financialcommitment;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.fluxfund.api.domain.financialcommitment.dto.FinancialCommitmentAllocationSummaryResponse;

public record FinancialCommitmentMonthlyItemResponse(

        FinancialCommitmentAllocationSummaryResponse commitment,
        LocalDate referenceMonth,
        LocalDate dueDate,
        BigDecimal expectedAmount,
        BigDecimal realizedAmount,
        BigDecimal pendingAmount,
        BigDecimal exceededAmount,
        FinancialCommitmentRealizationStatus status,
        boolean overdue,
        long allocationCount,
        LocalDate lastSettlementDate) {
}