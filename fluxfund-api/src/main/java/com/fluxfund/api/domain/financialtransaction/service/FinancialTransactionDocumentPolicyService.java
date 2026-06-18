package com.fluxfund.api.domain.financialtransaction.service;

import org.springframework.stereotype.Service;

import com.fluxfund.api.domain.financialtransaction.FinancialTransaction;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionType;
import com.fluxfund.api.domain.financialtransaction.FiscalDocumentPolicy;
import com.fluxfund.api.shared.exception.BusinessException;

@Service
public class FinancialTransactionDocumentPolicyService {

    public void normalizeAndValidate(FinancialTransaction transaction) {
        FiscalDocumentPolicy policy = transaction.getFiscalDocumentPolicy() != null
                ? transaction.getFiscalDocumentPolicy()
                : FiscalDocumentPolicy.CATEGORY;

        transaction.setFiscalDocumentPolicy(policy);
        transaction.setFiscalDocumentNote(normalizeText(transaction.getFiscalDocumentNote()));

        if (transaction.getType() != FinancialTransactionType.EXPENSE) {
            transaction.setFiscalDocumentPolicy(FiscalDocumentPolicy.CATEGORY);
            transaction.setFiscalDocumentNote(null);
            return;
        }

        if (policy == FiscalDocumentPolicy.WAIVED
                || policy == FiscalDocumentPolicy.MISSING) {
            if (transaction.getFiscalDocumentNote() == null) {
                throw new BusinessException(
                        "Fiscal document note is required when document is waived or missing");
            }
        }

        if (policy == FiscalDocumentPolicy.CATEGORY) {
            transaction.setFiscalDocumentNote(null);
        }
    }

    private String normalizeText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }
}