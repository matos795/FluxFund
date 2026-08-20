package com.fluxfund.api.domain.report.dto.financialrelationship;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record FinancialRelationshipPartySummaryResponse(

        UUID partyId,
        String partyName,
        BigDecimal totalAmount,
        BigDecimal sharePercentage,
        long allocationCount,
        int activeMonthCount,
        LocalDate firstSettlementDate,
        LocalDate lastSettlementDate
) {
}