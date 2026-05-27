package com.fluxfund.api.domain.report.dto.category;

import java.math.BigDecimal;
import java.util.UUID;

import com.fluxfund.api.domain.financialtransaction.FinancialTransactionType;

public record CategoryResultItemResponse(
        UUID categoryId,
        String categoryName,
        UUID parentCategoryId,
        String parentCategoryName,
        FinancialTransactionType type,
        BigDecimal total,
        long transactionCount
) {
}