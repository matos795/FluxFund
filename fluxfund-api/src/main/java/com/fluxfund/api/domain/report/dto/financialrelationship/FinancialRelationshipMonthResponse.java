package com.fluxfund.api.domain.report.dto.financialrelationship;

import java.math.BigDecimal;
import java.time.LocalDate;

public record FinancialRelationshipMonthResponse(

        LocalDate referenceMonth,
        BigDecimal receivedFromPartiesAmount,
        BigDecimal paidToPartiesAmount
) {
}