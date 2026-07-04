package com.fluxfund.api.domain.report.dto.creditcardstatement;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreditCardStatementReportItemResponse(
        UUID transactionId,
        LocalDate purchaseDate,
        String description,
        String categoryName,
        Integer installmentNumber,
        Integer installmentCount,
        BigDecimal amount,
        boolean classified
) {
}