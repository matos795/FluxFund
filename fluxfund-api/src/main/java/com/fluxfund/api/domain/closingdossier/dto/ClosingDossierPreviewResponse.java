package com.fluxfund.api.domain.closingdossier.dto;

import java.time.LocalDate;
import java.util.List;

public record ClosingDossierPreviewResponse(
        LocalDate periodStartDate,
        LocalDate periodEndDate,

        boolean includeAccountsWithoutMovement,
        boolean includeIncomes,
        boolean includeExpenses,
        boolean includeTransfers,

        int selectedAccountCount,
        int includedAccountCount,

        long totalTransactionCount,
        long accountsWithoutMovementCount,
        long accountsWithoutBankStatementCount,
        long expensesWithoutPaymentProofCount,
        long expensesWithoutFiscalDocumentCount,

        List<ClosingDossierAccountPreviewResponse> accounts
) {
}