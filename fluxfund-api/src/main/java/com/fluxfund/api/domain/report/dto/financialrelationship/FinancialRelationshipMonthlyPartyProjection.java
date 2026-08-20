package com.fluxfund.api.domain.report.dto.financialrelationship;

import java.math.BigDecimal;
import java.util.UUID;

public interface FinancialRelationshipMonthlyPartyProjection {

    UUID getPartyId();
    String getPartyName();
    Integer getSettlementYear();
    Integer getSettlementMonth();
    BigDecimal getTotalAmount();
}