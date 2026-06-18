package com.fluxfund.api.domain.dashboard.dto;

import java.util.List;

public record DashboardActionItemsResponse(
        List<DashboardTransactionActionItemResponse> unclassifiedTransactions,
        List<DashboardTransactionActionItemResponse> unallocatedTransactions,
        List<DashboardTransactionActionItemResponse> expensesWithoutFiscalDocument,
        List<DashboardTransactionActionItemResponse> missingFiscalDocumentTransactions,
        List<DashboardFundActionItemResponse> negativeFunds
) {
}