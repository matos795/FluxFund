package com.fluxfund.api.domain.financialtransaction;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;

class FinancialTransactionTest {

        @Test
        void shouldMarkTransactionAsTechnicalMovement() {

                FinancialTransaction transaction = new FinancialTransaction();

                transaction.markAsTechnicalMovement(TechnicalMovementType.NUBANK_PIX_CREDIT_BRIDGE);

                assertThat(
                                transaction.isTechnicalMovement())
                                .isTrue();

                assertThat(
                                transaction.getTechnicalMovementType())
                                .isEqualTo(
                                                TechnicalMovementType.NUBANK_PIX_CREDIT_BRIDGE);
        }

        @Test
        void shouldRejectNullTechnicalMovementType() {

                FinancialTransaction transaction = new FinancialTransaction();

                assertThatThrownBy(() -> transaction.markAsTechnicalMovement(null))
                                .isInstanceOf(NullPointerException.class);
        }

        @Test
        void shouldReturnPositiveAmountForRegularCreditCardStatementItem() {

                FinancialTransaction transaction = new FinancialTransaction();

                transaction.setExpectedAmount(
                                new BigDecimal("100.00"));

                assertThat(transaction.getSignedCreditCardStatementAmount()).isEqualByComparingTo("100.00");
        }

        @Test
        void shouldReturnNegativeAmountForCreditCardStatementCredit() {

                FinancialTransaction transaction = new FinancialTransaction();
                transaction.setExpectedAmount(new BigDecimal("27.90"));
                transaction.markAsTechnicalMovement(TechnicalMovementType.CREDIT_CARD_STATEMENT_CREDIT);

                assertThat(transaction.getSignedCreditCardStatementAmount()).isEqualByComparingTo("-27.90");
        }
}