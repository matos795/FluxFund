package com.fluxfund.api.domain.financialtransaction.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import com.fluxfund.api.domain.financialtransaction.TechnicalMovementType;
import com.fluxfund.api.shared.ofx.OfxTextNormalizer;
import com.webcohesion.ofx4j.domain.data.common.Transaction;

class NubankPixCreditBridgeDetectorTest {

    private final NubankPixCreditBridgeDetector detector = new NubankPixCreditBridgeDetector(
            new OfxTextNormalizer());

    @Test
    void shouldDetectNubankPixCreditBridgePair() {

        Date postedDate = new Date();

        String baseExternalId = "6a846646-0a48-46be-a2b0-fe4de21dcde1";

        Transaction fundingEntry = transaction(
                baseExternalId,
                "50.00",
                postedDate,
                "Valor adicionado na conta por cartão de crédito - "
                        + "Valor adicionado para Pix no Crédito");

        Transaction pixOut = transaction(
                baseExternalId + ":reversal",
                "-50.00",
                postedDate,
                "Transferência enviada pelo Pix");

        Map<String, TechnicalMovementType> result = detector.detect(
                List.of(
                        fundingEntry,
                        pixOut));

        assertThat(result)
                .hasSize(2)
                .containsEntry(
                        baseExternalId,
                        TechnicalMovementType.NUBANK_PIX_CREDIT_BRIDGE)
                .containsEntry(
                        baseExternalId + ":reversal",
                        TechnicalMovementType.NUBANK_PIX_CREDIT_BRIDGE);
    }

    @Test
    void shouldNotDetectFundingEntryWithoutReversal() {

        Date postedDate = Date.from(
                Instant.parse(
                        "2026-08-18T12:00:00Z"));

        Transaction fundingEntry = transaction(
                "abc",
                "50.00",
                postedDate,
                "Valor adicionado na conta por cartão de crédito - "
                        + "Valor adicionado para Pix no Crédito");

        Map<String, TechnicalMovementType> result = detector.detect(
                List.of(
                        fundingEntry));

        assertThat(result)
                .isEmpty();
    }

    @Test
    void shouldNotDetectWhenAmountsDoNotCancelEachOther() {

        Date postedDate = Date.from(
                Instant.parse(
                        "2026-08-18T12:00:00Z"));

        Transaction fundingEntry = transaction(
                "abc",
                "50.00",
                postedDate,
                "Valor adicionado para Pix no Crédito");

        Transaction pixOut = transaction(
                "abc:reversal",
                "-49.99",
                postedDate,
                "Transferência enviada pelo Pix");

        Map<String, TechnicalMovementType> result = detector.detect(
                List.of(
                        fundingEntry,
                        pixOut));

        assertThat(result)
                .isEmpty();
    }

    @Test
    void shouldNotDetectWhenEntriesAreOnDifferentDates() {

        Date fundingDate = Date.from(
                Instant.parse(
                        "2026-08-18T12:00:00Z"));

        Date pixDate = Date.from(
                Instant.parse(
                        "2026-08-19T12:00:00Z"));

        Transaction fundingEntry = transaction(
                "abc",
                "50.00",
                fundingDate,
                "Valor adicionado para Pix no Crédito");

        Transaction pixOut = transaction(
                "abc:reversal",
                "-50.00",
                pixDate,
                "Transferência enviada pelo Pix");

        Map<String, TechnicalMovementType> result = detector.detect(
                List.of(
                        fundingEntry,
                        pixOut));

        assertThat(result)
                .isEmpty();
    }

    @Test
    void shouldNotDetectRegularPixAsCreditBridge() {

        Date postedDate = Date.from(
                Instant.parse(
                        "2026-08-18T12:00:00Z"));

        Transaction incomingPix = transaction(
                "abc",
                "50.00",
                postedDate,
                "Transferência recebida pelo Pix");

        Transaction outgoingPix = transaction(
                "abc:reversal",
                "-50.00",
                postedDate,
                "Transferência enviada pelo Pix");

        Map<String, TechnicalMovementType> result = detector.detect(
                List.of(
                        incomingPix,
                        outgoingPix));

        assertThat(result)
                .isEmpty();
    }

    @Test
    void shouldNotDetectWhenReversalIsNotOutgoingPix() {

        Date postedDate = Date.from(
                Instant.parse(
                        "2026-08-18T12:00:00Z"));

        Transaction fundingEntry = transaction(
                "abc",
                "50.00",
                postedDate,
                "Valor adicionado para Pix no Crédito");

        Transaction unrelatedExpense = transaction(
                "abc:reversal",
                "-50.00",
                postedDate,
                "Compra no débito");

        Map<String, TechnicalMovementType> result = detector.detect(
                List.of(
                        fundingEntry,
                        unrelatedExpense));

        assertThat(result)
                .isEmpty();
    }

    private Transaction transaction(
            String externalId,
            String amount,
            Date postedDate,
            String memo) {

        Transaction transaction = mock(Transaction.class);

        when(transaction.getId())
                .thenReturn(externalId);

        when(transaction.getBigDecimalAmount())
                .thenReturn(
                        new BigDecimal(amount));

        when(transaction.getDatePosted())
                .thenReturn(postedDate);

        when(transaction.getMemo())
                .thenReturn(memo);

        return transaction;
    }
}