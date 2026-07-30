package com.fluxfund.api.domain.transactionallocation.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

public record CreateTransactionAllocationRequest(

        @NotNull UUID fundId,

        UUID beneficiaryId,

        @NotNull @DecimalMin(value = "0.01") BigDecimal amount,

        LocalDate referenceMonth,

        UUID sourcePartyId,

        UUID recipientPartyId) {

    /*
     * Mantém compatibilidade com os pontos Java
     * que ainda criam a requisição usando quatro
     * argumentos.
     */
    public CreateTransactionAllocationRequest(
            UUID fundId,
            UUID beneficiaryId,
            BigDecimal amount,
            LocalDate referenceMonth) {

        this(fundId, beneficiaryId, amount, referenceMonth, null, null);
    }
}