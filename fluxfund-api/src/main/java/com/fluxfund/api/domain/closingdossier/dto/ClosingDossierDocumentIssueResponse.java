package com.fluxfund.api.domain.closingdossier.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import com.fluxfund.api.domain.financialtransaction.FiscalDocumentPolicy;

public record ClosingDossierDocumentIssueResponse(
        UUID transactionId,
        LocalDate settlementDate,
        String description,
        String rawDescription,
        String categoryName,
        BigDecimal amount,
        FiscalDocumentPolicy fiscalDocumentPolicy,
        String fiscalDocumentNote,
        ClosingDossierDocumentIssueType issueType
) {
}