package com.fluxfund.api.domain.report.dto;

import java.math.BigDecimal;
import java.util.UUID;

import com.fluxfund.api.domain.financialtransaction.FinancialTransactionType;

public record CategoryResultItemResponse(
        UUID categoryId,
        String categoryName,
        FinancialTransactionType type,
        BigDecimal total,
        long transactionCount
) {
}