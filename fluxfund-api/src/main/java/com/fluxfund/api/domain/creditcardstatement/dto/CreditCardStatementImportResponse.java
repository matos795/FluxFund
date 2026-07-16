package com.fluxfund.api.domain.creditcardstatement.dto;

import java.util.List;

import com.fluxfund.api.domain.financialtransaction.dto.FinancialTransactionResponse;

public record CreditCardStatementImportResponse(
        int importedCount,
        int detectedPaymentCount,
        int reconciledPaymentCount,
        int ignoredDuplicateCount,
        List<FinancialTransactionResponse> importedItems,
        int reviewRequiredCount,
        int failedCount,
        List<String> warnings,
        List<String> errors
) {
}