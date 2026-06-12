package com.fluxfund.api.shared.importer;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ImportedTransactionRow(
        LocalDate date,
        String description,
        BigDecimal amount,
        String externalId,
        String documentNumber
) {
}