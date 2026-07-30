package com.fluxfund.api.domain.transactionallocation.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.validation.constraints.DecimalMin;

public record UpdateTransactionAllocationRequest(
                UUID fundId,
                UUID beneficiaryId,
                @DecimalMin(value = "0.01") BigDecimal amount,
                LocalDate referenceMonth,
                UUID sourcePartyId,
                UUID recipientPartyId) {
}