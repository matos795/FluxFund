package com.fluxfund.api.domain.financialtransaction.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.fluxfund.api.domain.financialtransaction.FinancialTransactionType;
import com.fluxfund.api.domain.transactionallocation.dto.CreateTransactionAllocationRequest;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ClassifyFinancialTransactionRequest(
    @NotNull
    FinancialTransactionType type,
    @NotNull
    UUID categoryId,
    LocalDate dueDate,
    @NotNull
    LocalDate settlementDate,
    @DecimalMin(value = "0.01")
    BigDecimal expectedAmount,
    @DecimalMin(value = "0.00")
    BigDecimal settledAmount,
    @Size(max = 500)
    String description,
    @Size(max = 255)
    String documentNumber,
    @Valid
    List<CreateTransactionAllocationRequest> allocations
) {

}
