package com.fluxfund.api.domain.financialtransaction.service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fluxfund.api.domain.financialtransaction.dto.TechnicalMovementBackfillPreview;
import com.fluxfund.api.domain.financialtransaction.dto.TechnicalMovementBackfillPreviewItem;
import com.fluxfund.api.domain.financialtransaction.repository.FinancialTransactionRepository;
import com.fluxfund.api.domain.financialtransaction.repository.TechnicalMovementBackfillPairProjection;
import com.fluxfund.api.domain.financialtransaction.FinancialTransaction;
import com.fluxfund.api.domain.financialtransaction.TechnicalMovementType;
import com.fluxfund.api.domain.financialtransaction.dto.TechnicalMovementBackfillExecutionResult;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TechnicalMovementBackfillService {

    private final FinancialTransactionRepository repository;

    private final NubankPixCreditBridgeDetector detector;

    public TechnicalMovementBackfillPreview previewNubankPixCreditBridge(UUID organizationId) {

        List<TechnicalMovementBackfillPairProjection> structuralCandidates = repository
                .findNubankPixCreditBridgeBackfillCandidates(organizationId);

        List<TechnicalMovementBackfillPreviewItem> confirmedPairs = new ArrayList<>();

        int transactionsToMark = 0;

        for (TechnicalMovementBackfillPairProjection candidate : structuralCandidates) {

            boolean confirmed = detector.matchesKnownDescriptions(
                    candidate.getFundingRawDescription(),
                    candidate.getReversalRawDescription());

            if (!confirmed) {
                continue;
            }

            if (!candidate.getFundingTechnicalMovement()) {
                transactionsToMark++;
            }

            if (!candidate.getReversalTechnicalMovement()) {
                transactionsToMark++;
            }

            confirmedPairs.add(
                    new TechnicalMovementBackfillPreviewItem(
                            candidate.getFundingTransactionId(),

                            candidate.getReversalTransactionId(),

                            candidate.getAccountId(),

                            candidate.getSettlementDate(),

                            candidate.getAmount(),

                            candidate.getFundingTechnicalMovement(),

                            candidate.getReversalTechnicalMovement()));
        }

        return new TechnicalMovementBackfillPreview(
                structuralCandidates.size(),
                confirmedPairs.size(),
                transactionsToMark,
                List.copyOf(
                        confirmedPairs));
    }

    @Transactional
    public TechnicalMovementBackfillExecutionResult executeNubankPixCreditBridge(
            UUID organizationId) {

        List<TechnicalMovementBackfillPairProjection> structuralCandidates = repository
                .findNubankPixCreditBridgeBackfillCandidates(
                        organizationId);

        int confirmedPairs = 0;

        int transactionsMarked = 0;

        for (TechnicalMovementBackfillPairProjection candidate : structuralCandidates) {

            boolean confirmed = detector.matchesKnownDescriptions(
                    candidate
                            .getFundingRawDescription(),
                    candidate
                            .getReversalRawDescription());

            if (!confirmed) {
                continue;
            }

            FinancialTransaction funding = repository
                    .findByIdAndOrganizationId(
                            candidate
                                    .getFundingTransactionId(),
                            organizationId)
                    .orElseThrow();

            FinancialTransaction reversal = repository
                    .findByIdAndOrganizationId(
                            candidate
                                    .getReversalTransactionId(),
                            organizationId)
                    .orElseThrow();

            /*
             * Não confiamos apenas no snapshot da projection.
             * Antes de alterar, confirmamos novamente as
             * descrições armazenadas nas entidades atuais.
             */
            boolean stillConfirmed = detector.matchesKnownDescriptions(
                    funding.getRawDescription(),
                    reversal.getRawDescription());

            if (!stillConfirmed) {
                throw new IllegalStateException(
                        "Technical movement backfill candidate changed during execution");
            }

            confirmedPairs++;

            if (!funding.isTechnicalMovement()) {

                funding.markAsTechnicalMovement(
                        TechnicalMovementType.NUBANK_PIX_CREDIT_BRIDGE);

                transactionsMarked++;
            }

            if (!reversal.isTechnicalMovement()) {

                reversal.markAsTechnicalMovement(
                        TechnicalMovementType.NUBANK_PIX_CREDIT_BRIDGE);

                transactionsMarked++;
            }
        }

        return new TechnicalMovementBackfillExecutionResult(
                structuralCandidates.size(),
                confirmedPairs,
                transactionsMarked);
    }
}