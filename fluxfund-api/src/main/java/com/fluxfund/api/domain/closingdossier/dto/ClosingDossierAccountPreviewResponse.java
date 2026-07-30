package com.fluxfund.api.domain.closingdossier.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import com.fluxfund.api.domain.account.AccountType;
import com.fluxfund.api.domain.bankstatementdocument.dto.BankStatementDocumentResponse;

public record ClosingDossierAccountPreviewResponse(
        UUID accountId,
        String accountName,
        AccountType accountType,

        boolean hasMovement,
        boolean includedInDossier,

        boolean requiresBankStatement,
        boolean hasBankStatement,
        List<BankStatementDocumentResponse> bankStatementDocuments,

        long transactionCount,
        BigDecimal incomeTotal,
        BigDecimal expenseTotal,
        BigDecimal transferTotal,

        List<ClosingDossierDocumentIssueResponse> paymentProofIssues,
        List<ClosingDossierDocumentIssueResponse> fiscalDocumentIssues
) {
}