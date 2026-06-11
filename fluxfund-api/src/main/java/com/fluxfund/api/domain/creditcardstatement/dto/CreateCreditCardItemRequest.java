package com.fluxfund.api.domain.creditcardstatement.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.fluxfund.api.domain.transactionallocation.dto.CreateTransactionAllocationRequest;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateCreditCardItemRequest(
        @NotNull
        LocalDate purchaseDate,

        @NotBlank
        @Size(max = 500)
        String description,

        @NotNull
        @DecimalMin("0.01")
        BigDecimal amount,

        @NotNull
        UUID categoryId,

        @Size(max = 255)
        String documentNumber,

        Integer installmentNumber,

        Integer installmentCount,

        @Valid
        List<CreateTransactionAllocationRequest> allocations
) {
}