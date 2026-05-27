package com.fluxfund.api.domain.supportagreement.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateSupportAgreementRequest(
        @NotNull
        UUID organizationId,

        @NotNull
        UUID beneficiaryId,

        @NotNull
        UUID fundId,

        @NotNull
        @DecimalMin(value = "0.01")
        BigDecimal amount,

        @NotNull
        LocalDate startDate,

        LocalDate endDate,

        @Size(max = 255)
        String description
) {
}