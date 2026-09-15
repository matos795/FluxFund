package com.fluxfund.api.domain.financialtransaction.service;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.fluxfund.api.domain.financialtransaction.TechnicalMovementType;
import com.fluxfund.api.shared.ofx.OfxTextNormalizer;
import com.webcohesion.ofx4j.domain.data.common.Transaction;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class NubankPixCreditBridgeDetector {

    private static final String FUNDING_DESCRIPTION = "valor adicionado para pix no credito";

    private static final String PIX_OUT_DESCRIPTION = "transferencia enviada pelo pix";

    private final OfxTextNormalizer ofxTextNormalizer;

    public Map<String, TechnicalMovementType> detect(List<Transaction> transactions) {

        Map<String, Transaction> transactionsByExternalId = transactions.stream()
                .filter(transaction -> normalizeExternalId(transaction) != null)
                .collect(
                        Collectors.toMap(
                                this::normalizeExternalId,
                                Function.identity(),
                                (first, ignored) -> first));

        Map<String, TechnicalMovementType> detected = new HashMap<>();

        for (Transaction fundingEntry : transactions) {

            if (!isNubankPixCreditFundingEntry(fundingEntry)) {
                continue;
            }

            String baseExternalId = normalizeExternalId(fundingEntry);

            if (baseExternalId == null) {
                continue;
            }

            String reversalExternalId = baseExternalId + ":reversal";

            Transaction pixOut = transactionsByExternalId.get(reversalExternalId);

            if (!isMatchingPixOut(fundingEntry, pixOut)) {
                continue;
            }

            detected.put(
                    baseExternalId,
                    TechnicalMovementType.NUBANK_PIX_CREDIT_BRIDGE);

            detected.put(
                    reversalExternalId,
                    TechnicalMovementType.NUBANK_PIX_CREDIT_BRIDGE);
        }

        return Map.copyOf(detected);
    }

    private boolean isNubankPixCreditFundingEntry(Transaction transaction) {

        BigDecimal amount = transaction.getBigDecimalAmount();

        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            return false;
        }

        String description = normalizedDescription(transaction);

        return description.contains(FUNDING_DESCRIPTION);
    }

    private boolean isMatchingPixOut(Transaction fundingEntry, Transaction pixOut) {

        if (pixOut == null) {
            return false;
        }

        BigDecimal fundingAmount = fundingEntry.getBigDecimalAmount();

        BigDecimal pixOutAmount = pixOut.getBigDecimalAmount();

        if (fundingAmount == null || pixOutAmount == null) {
            return false;
        }

        if (pixOutAmount.compareTo(fundingAmount.negate()) != 0) {
            return false;
        }

        if (!Objects.equals(postedDate(fundingEntry), postedDate(pixOut))) {
            return false;
        }

        String description = normalizedDescription(pixOut);

        return description.contains(PIX_OUT_DESCRIPTION);
    }

    private LocalDate postedDate(Transaction transaction) {

        if (transaction.getDatePosted() == null) {
            return null;
        }

        return transaction
                .getDatePosted()
                .toInstant()
                .atZone(ZoneId.systemDefault())
                .toLocalDate();
    }

    private String normalizeExternalId(Transaction transaction) {

        if (transaction.getId() == null) {
            return null;
        }

        String externalId = transaction.getId().trim();

        return externalId.isBlank()
                ? null
                : externalId;
    }

    private String normalizedDescription(Transaction transaction) {

        String rawDescription = transaction.getMemo();

        if (rawDescription == null || rawDescription.isBlank()) {
            rawDescription = transaction.getName();
        }

        if (rawDescription == null || rawDescription.isBlank()) {
            return "";
        }

        String repaired = ofxTextNormalizer.normalize(rawDescription);

        String withoutAccents = Normalizer.normalize(
                repaired,
                Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");

        return withoutAccents
                .toLowerCase(Locale.ROOT)
                .replaceAll("\\s+", " ")
                .trim();
    }
}