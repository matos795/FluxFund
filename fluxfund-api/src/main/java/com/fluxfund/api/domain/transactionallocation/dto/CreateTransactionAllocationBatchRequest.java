package com.fluxfund.api.domain.transactionallocation.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

public record CreateTransactionAllocationBatchRequest(
        @NotEmpty List<@Valid CreateTransactionAllocationRequest> allocations
) {
}