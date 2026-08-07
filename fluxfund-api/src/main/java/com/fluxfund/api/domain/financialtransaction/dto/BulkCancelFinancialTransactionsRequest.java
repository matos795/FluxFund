package com.fluxfund.api.domain.financialtransaction.dto;

import java.util.List;
import java.util.UUID;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

public record BulkCancelFinancialTransactionsRequest(

        @NotEmpty(
                message = "Select at least one transaction")
        @Size(
                max = 50,
                message = "You can cancel at most 50 transactions at once")
        List<UUID> transactionIds

) {
}