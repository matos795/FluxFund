package com.fluxfund.api.domain.closingdossier.export;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.fluxfund.api.domain.attachment.Attachment;
import com.fluxfund.api.domain.creditcardstatement.CreditCardStatement;
import com.fluxfund.api.domain.financialtransaction.FinancialTransaction;
import com.fluxfund.api.domain.report.dto.creditcardstatement.CreditCardStatementReportResponse;

public record ClosingDossierCreditCardStatement(
        CreditCardStatement statement,
        CreditCardStatementReportResponse report,
        List<FinancialTransaction> items,
        Map<UUID, List<Attachment>> attachmentsByTransactionId
) {

    public List<Attachment> getAttachments(
            FinancialTransaction item) {

        return attachmentsByTransactionId.getOrDefault(
                item.getId(),
                List.of());
    }
}