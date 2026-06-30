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

                boolean includesSupportReport,
                boolean includesPayablesReport,
                boolean includesReceivablesReport,

                int selectedAccountCount,
                int includedAccountCount,
                int automaticSectionCount,

                long totalTransactionCount,
                long accountsWithoutMovementCount,
                long accountsWithoutBankStatementCount,
                long expensesWithoutPaymentProofCount,
                long expensesWithoutFiscalDocumentCount,

                List<ClosingDossierAccountPreviewResponse> accounts) {
}