package com.fluxfund.api.domain.closingdossier.export;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import com.fluxfund.api.domain.account.Account;
import com.fluxfund.api.domain.attachment.Attachment;
import com.fluxfund.api.domain.bankstatementdocument.BankStatementDocument;
import com.fluxfund.api.domain.closingdossier.dto.ClosingDossierAccountPreviewResponse;
import com.fluxfund.api.domain.financialtransaction.FinancialTransaction;

public record ClosingDossierExportAccount(
        Account account,
        ClosingDossierAccountPreviewResponse preview,
        List<BankStatementDocument> bankStatementDocuments,
        List<FinancialTransaction> transactions,
        Map<UUID, List<Attachment>> attachmentsByTransactionId,
        Map<UUID, ClosingDossierCreditCardStatement>
                creditCardStatementsByPaymentTransactionId,
        Set<UUID> creditCardStatementItemIds
) {

    public List<Attachment> getAttachments(
            FinancialTransaction transaction) {

        return attachmentsByTransactionId.getOrDefault(
                transaction.getId(),
                List.of());
    }

    public Optional<ClosingDossierCreditCardStatement>
            findCreditCardStatementForPayment(
                    FinancialTransaction transaction) {

        return Optional.ofNullable(
                creditCardStatementsByPaymentTransactionId.get(
                        transaction.getId()));
    }

    public boolean isCreditCardStatementItem(
            FinancialTransaction transaction) {

        return creditCardStatementItemIds.contains(
                transaction.getId());
    }
}