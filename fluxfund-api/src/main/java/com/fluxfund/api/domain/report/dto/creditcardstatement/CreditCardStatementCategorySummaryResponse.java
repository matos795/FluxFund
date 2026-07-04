package com.fluxfund.api.domain.report.dto.creditcardstatement;

import java.math.BigDecimal;

public record CreditCardStatementCategorySummaryResponse(
        String categoryName,
        BigDecimal totalAmount,
        long itemCount
) {
}