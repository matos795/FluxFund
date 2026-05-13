package com.fluxfund.api.domain.transactionallocation.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record TransactionAllocationResponse(
        UUID id,
        UUID financialTransactionId,
        UUID fundId,
        UUID beneficiaryId,
        BigDecimal amount,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt) {

}
