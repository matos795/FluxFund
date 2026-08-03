package com.fluxfund.api.domain.financialcommitment.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateFinancialCommitmentVersionRequest(

        @NotNull @DecimalMin(value = "0.01") BigDecimal amount,

        @NotNull LocalDate startDate,

        @Size(max = 255) String description) {
}