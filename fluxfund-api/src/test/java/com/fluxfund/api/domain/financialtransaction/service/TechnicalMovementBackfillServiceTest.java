package com.fluxfund.api.domain.financialtransaction.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.fluxfund.api.domain.financialtransaction.repository.FinancialTransactionRepository;
import com.fluxfund.api.domain.financialtransaction.repository.TechnicalMovementBackfillPairProjection;

@ExtendWith(MockitoExtension.class)
class TechnicalMovementBackfillServiceTest {

    @Mock
    private FinancialTransactionRepository repository;

    @Mock
    private NubankPixCreditBridgeDetector detector;

    @InjectMocks
    private TechnicalMovementBackfillService service;

    @Test
    void shouldPreviewOnlyConfirmedPairsWithoutChangingAnything() {

        UUID organizationId = UUID.randomUUID();

        TechnicalMovementBackfillPairProjection validPair = candidate(
                false,
                false,
                "entrada válida",
                "saída válida");

        TechnicalMovementBackfillPairProjection invalidDescriptionPair = rejectedCandidate(
                "entrada inválida",
                "saída inválida");

        TechnicalMovementBackfillPairProjection partiallyMarkedPair = candidate(
                true,
                false,
                "entrada parcial",
                "saída parcial");

        when(repository
                .findNubankPixCreditBridgeBackfillCandidates(
                        organizationId))
                .thenReturn(
                        List.of(
                                validPair,
                                invalidDescriptionPair,
                                partiallyMarkedPair));

        when(detector.matchesKnownDescriptions(
                validPair.getFundingRawDescription(),
                validPair.getReversalRawDescription()))
                .thenReturn(true);

        when(detector.matchesKnownDescriptions(
                invalidDescriptionPair.getFundingRawDescription(),
                invalidDescriptionPair.getReversalRawDescription()))
                .thenReturn(false);

        when(detector.matchesKnownDescriptions(
                partiallyMarkedPair.getFundingRawDescription(),
                partiallyMarkedPair.getReversalRawDescription()))
                .thenReturn(true);

        var preview = service.previewNubankPixCreditBridge(
                organizationId);

        assertThat(
                preview.structuralCandidatePairs())
                .isEqualTo(3);

        assertThat(
                preview.confirmedPairs())
                .isEqualTo(2);

        /*
         * Primeiro par:
         * 2 ainda precisam ser marcadas.
         *
         * Segundo confirmado:
         * funding já estava técnico,
         * reversal ainda não.
         *
         * Total = 3.
         */
        assertThat(
                preview.transactionsToMark())
                .isEqualTo(3);

        assertThat(
                preview.pairs())
                .hasSize(2);
    }

    private TechnicalMovementBackfillPairProjection candidate(
            boolean fundingTechnical,
            boolean reversalTechnical,
            String fundingDescription,
            String reversalDescription) {

        TechnicalMovementBackfillPairProjection candidate = mock(
                TechnicalMovementBackfillPairProjection.class);

        when(candidate
                .getFundingTransactionId())
                .thenReturn(
                        UUID.randomUUID());

        when(candidate
                .getReversalTransactionId())
                .thenReturn(
                        UUID.randomUUID());

        when(candidate
                .getAccountId())
                .thenReturn(
                        UUID.randomUUID());

        when(candidate
                .getSettlementDate())
                .thenReturn(
                        LocalDate.of(
                                2026,
                                8,
                                18));

        when(candidate
                .getAmount())
                .thenReturn(
                        new BigDecimal(
                                "50.00"));

        when(candidate
                .getFundingRawDescription())
                .thenReturn(
                        fundingDescription);

        when(candidate
                .getReversalRawDescription())
                .thenReturn(
                        reversalDescription);

        when(candidate
                .getFundingTechnicalMovement())
                .thenReturn(
                        fundingTechnical);

        when(candidate
                .getReversalTechnicalMovement())
                .thenReturn(
                        reversalTechnical);

        return candidate;
    }

    private TechnicalMovementBackfillPairProjection rejectedCandidate(
            String fundingDescription,
            String reversalDescription) {

        TechnicalMovementBackfillPairProjection candidate = mock(
                TechnicalMovementBackfillPairProjection.class);

        when(candidate
                .getFundingRawDescription())
                .thenReturn(
                        fundingDescription);

        when(candidate
                .getReversalRawDescription())
                .thenReturn(
                        reversalDescription);

        return candidate;
    }
}