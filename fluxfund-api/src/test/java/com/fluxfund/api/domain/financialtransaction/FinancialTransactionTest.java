package com.fluxfund.api.domain.financialtransaction;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

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
}