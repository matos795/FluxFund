package com.fluxfund.api.domain.report.dto.financialrelationship;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public interface FinancialRelationshipPartyProjection {

    UUID getPartyId();
    String getPartyName();
    BigDecimal getTotalAmount();
    Long getAllocationCount();
    LocalDate getFirstSettlementDate();
    LocalDate getLastSettlementDate();
}