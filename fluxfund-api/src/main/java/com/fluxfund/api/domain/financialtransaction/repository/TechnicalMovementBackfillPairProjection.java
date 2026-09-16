package com.fluxfund.api.domain.financialtransaction.repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public interface TechnicalMovementBackfillPairProjection {

    UUID getFundingTransactionId();

    UUID getReversalTransactionId();

    UUID getOrganizationId();

    UUID getAccountId();

    String getFundingExternalId();

    String getReversalExternalId();

    LocalDate getSettlementDate();

    BigDecimal getAmount();

    String getFundingRawDescription();

    String getReversalRawDescription();

    boolean getFundingTechnicalMovement();

    String getFundingTechnicalMovementType();

    boolean getReversalTechnicalMovement();

    String getReversalTechnicalMovementType();
}