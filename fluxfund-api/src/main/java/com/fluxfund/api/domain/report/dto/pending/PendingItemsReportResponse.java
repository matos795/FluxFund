package com.fluxfund.api.domain.report.dto.pending;

import java.util.List;

public record PendingItemsReportResponse(
        long unclassifiedCount,
        long unallocatedCount,
        long missingDocumentsCount,
        long pendingCreditCardStatementsCount,
        long negativeFundsCount,

        List<PendingTransactionItemResponse> unclassifiedTransactions,
        List<PendingTransactionItemResponse> unallocatedTransactions,
        List<PendingTransactionItemResponse> missingDocumentTransactions,
        List<PendingCreditCardStatementResponse> pendingCreditCardStatements,
        List<PendingFundResponse> negativeFunds
) {
}