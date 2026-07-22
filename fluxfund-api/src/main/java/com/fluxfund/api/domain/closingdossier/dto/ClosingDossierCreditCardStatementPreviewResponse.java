package com.fluxfund.api.domain.closingdossier.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.fluxfund.api.domain.creditcardstatement.CreditCardStatementStatus;

public record ClosingDossierCreditCardStatementPreviewResponse(
        UUID statementId,
        String statementName,

        UUID creditCardAccountId,
        String creditCardAccountName,

        CreditCardStatementStatus status,

        LocalDate closingDate,
        LocalDate dueDate,

        BigDecimal totalAmount,

        long itemCount,
        long unclassifiedItemCount,

        boolean hasOfficialPdf,

        List<ClosingDossierDocumentIssueResponse>
                fiscalDocumentIssues
) {
}