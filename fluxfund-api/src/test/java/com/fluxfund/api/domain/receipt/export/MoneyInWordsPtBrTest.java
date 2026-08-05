package com.fluxfund.api.domain.receipt.export;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;

class MoneyInWordsPtBrTest {

    @Test
    void shouldFormatAmountWithCents() {

        String result = MoneyInWordsPtBr.format(
                new BigDecimal(
                        "1250.75"));

        assertThat(result)
                .isEqualTo(
                        "mil e duzentos e cinquenta reais e setenta e cinco centavos");
    }

    @Test
    void shouldFormatOneRealAndOneCent() {

        String result = MoneyInWordsPtBr.format(
                new BigDecimal(
                        "1.01"));

        assertThat(result)
                .isEqualTo(
                        "um real e um centavo");
    }

    @Test
    void shouldFormatOnlyCents() {

        String result = MoneyInWordsPtBr.format(
                new BigDecimal(
                        "0.50"));

        assertThat(result)
                .isEqualTo(
                        "cinquenta centavos");
    }

    @Test
    void shouldFormatExactAmount() {

        String result = MoneyInWordsPtBr.format(
                new BigDecimal(
                        "100.00"));

        assertThat(result)
                .isEqualTo(
                        "cem reais");
    }
}