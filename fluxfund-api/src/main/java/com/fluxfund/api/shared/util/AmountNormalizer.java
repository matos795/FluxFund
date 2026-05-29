package com.fluxfund.api.shared.util;

import java.math.BigDecimal;

import com.fluxfund.api.domain.financialtransaction.FinancialTransaction;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionType;

public final class AmountNormalizer {

    private AmountNormalizer() {
    }

    public static BigDecimal normalizeAmount(
            FinancialTransaction financialTransaction,
            BigDecimal amount) {

        amount = amount.abs();

        if (financialTransaction.getType() == FinancialTransactionType.EXPENSE) {
            return amount.negate();
        }

        return amount;
    }
}
