package com.fluxfund.api.domain.financialcommitment.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import com.fluxfund.api.domain.financialcommitment.FinancialCommitmentDirection;
import com.fluxfund.api.domain.financialcommitment.FinancialCommitmentRecurrence;
import com.fluxfund.api.domain.financialcommitment.FinancialCommitmentType;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateFinancialCommitmentRequest(

        @NotNull UUID partyId,
        UUID designatedRecipientId,
        @NotNull UUID fundId,
        @NotNull FinancialCommitmentDirection direction,
        @NotNull FinancialCommitmentType commitmentType,
        @NotNull FinancialCommitmentRecurrence recurrence,
        @NotNull @DecimalMin(value = "0.01") BigDecimal amount,
        @Min(1) @Max(31) Integer dueDay,
        @NotNull LocalDate startDate,
        LocalDate endDate,
        @Size(max = 255) String description) {
}