package com.fluxfund.api.domain.report.projection;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public interface PendingDocumentTransactionProjection {

    UUID getTransactionId();

    LocalDate getSettlementDate();

    String getDescription();

    String getRawDescription();

    String getAccountName();

    String getCategoryName();

    BigDecimal getAmount();

    String getReason();
}