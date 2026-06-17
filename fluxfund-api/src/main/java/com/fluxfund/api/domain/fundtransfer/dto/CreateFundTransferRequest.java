package com.fluxfund.api.domain.fundtransfer.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateFundTransferRequest(
        @NotNull
        UUID sourceFundId,

        @NotNull
        UUID destinationFundId,

        @NotNull
        LocalDate transferDate,

        @NotNull
        @DecimalMin(value = "0.01")
        BigDecimal amount,

        @Size(max = 1000)
        String description
) {
}