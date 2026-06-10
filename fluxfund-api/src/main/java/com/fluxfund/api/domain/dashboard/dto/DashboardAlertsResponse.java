package com.fluxfund.api.domain.dashboard.dto;

public record DashboardAlertsResponse(
        long unclassifiedCount,
        long unallocatedCount,
        long negativeFundsCount,
        long expensesWithoutFiscalDocumentCount
) {
}