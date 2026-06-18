package com.fluxfund.api.domain.report.projection;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public interface PendingCreditCardStatementProjection {

    UUID getId();

    String getName();

    String getAccountName();

    String getStatus();

    LocalDate getDueDate();

    BigDecimal getTotalAmount();

    Long getPendingItemsCount();

    String getReason();
}