package com.fluxfund.api.domain.creditcardstatement.service;

import static org.assertj.core.api.Assertions
        .assertThat;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;

import com.webcohesion.ofx4j.domain.data.common.Transaction;
import com.webcohesion.ofx4j.domain.data.common.TransactionType;

class CreditCardOfxEntryClassifierTest {

    private final CreditCardOfxEntryClassifier classifier =
            new CreditCardOfxEntryClassifier();

    @Test
    void shouldTreatNegativePaymentTypeAsExpense() {

        Transaction transaction =
                mock(Transaction.class);

        when(transaction.getBigDecimalAmount())
                .thenReturn(
                        new BigDecimal("-150.00"));

        when(transaction.getTransactionType())
                .thenReturn(
                        TransactionType.PAYMENT);

        CreditCardOfxEntryType result =
                classifier.classify(
                        transaction,
                        "Compra no estabelecimento");

        assertThat(result)
                .isEqualTo(
                        CreditCardOfxEntryType.EXPENSE);
    }

    @Test
    void shouldTreatPositivePaymentTypeAsStatementPayment() {

        Transaction transaction =
                mock(Transaction.class);

        when(transaction.getBigDecimalAmount())
                .thenReturn(
                        new BigDecimal("150.00"));

        when(transaction.getTransactionType())
                .thenReturn(
                        TransactionType.PAYMENT);

        CreditCardOfxEntryType result =
                classifier.classify(
                        transaction,
                        "Pagamento recebido");

        assertThat(result)
                .isEqualTo(
                        CreditCardOfxEntryType.PAYMENT);
    }

    @Test
    void shouldTreatNegativeAmountAsExpenseEvenWhenDescriptionMentionsPayment() {

        Transaction transaction =
                mock(Transaction.class);

        when(transaction.getBigDecimalAmount())
                .thenReturn(
                        new BigDecimal("-89.90"));

        when(transaction.getTransactionType())
                .thenReturn(
                        TransactionType.PAYMENT);

        CreditCardOfxEntryType result =
                classifier.classify(
                        transaction,
                        "Pagamento aplicativo");

        assertThat(result)
                .isEqualTo(
                        CreditCardOfxEntryType.EXPENSE);
    }

    @Test
    void shouldRequireReviewForUnknownPositiveCredit() {

        Transaction transaction =
                mock(Transaction.class);

        when(transaction.getBigDecimalAmount())
                .thenReturn(
                        new BigDecimal("25.00"));

        when(transaction.getTransactionType())
                .thenReturn(
                        TransactionType.CREDIT);

        CreditCardOfxEntryType result =
                classifier.classify(
                        transaction,
                        "Ajuste de saldo");

        assertThat(result)
                .isEqualTo(
                        CreditCardOfxEntryType.REVIEW_REQUIRED);
    }

    @Test
    void shouldRequireReviewForZeroAmount() {

        Transaction transaction =
                mock(Transaction.class);

        when(transaction.getBigDecimalAmount())
                .thenReturn(
                        BigDecimal.ZERO);

        CreditCardOfxEntryType result =
                classifier.classify(
                        transaction,
                        "Lançamento sem valor");

        assertThat(result)
                .isEqualTo(
                        CreditCardOfxEntryType.REVIEW_REQUIRED);
    }
}