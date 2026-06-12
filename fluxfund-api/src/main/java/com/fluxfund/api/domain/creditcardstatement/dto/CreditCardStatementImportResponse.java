package com.fluxfund.api.domain.creditcardstatement.dto;

import java.util.List;

import com.fluxfund.api.domain.financialtransaction.dto.FinancialTransactionResponse;

public record CreditCardStatementImportResponse(
        int importedCount,
        int ignoredDuplicateCount,
        List<FinancialTransactionResponse> importedItems,
        int failedCount,
        List<String> errors
) {
}