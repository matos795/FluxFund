package com.fluxfund.api.domain.transactionallocation.dto;

import java.math.BigDecimal;
import java.util.UUID;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

public record CreateTransactionAllocationRequest(
        @NotNull UUID fundId,
        UUID beneficiaryId,
        @NotNull @DecimalMin(value = "0.01") BigDecimal amount) {

}
