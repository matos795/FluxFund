package com.fluxfund.api.domain.report.dto.financialcommitment;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public interface FinancialCommitmentRealizationProjection {

    UUID getCommitmentId();
    BigDecimal getRealizedAmount();
    Long getAllocationCount();
    LocalDate getLastSettlementDate();
}