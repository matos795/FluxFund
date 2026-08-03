package com.fluxfund.api.domain.financialcommitment.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;

public record LinkFinancialCommitmentRequest(

        @NotNull UUID financialCommitmentId) {
}