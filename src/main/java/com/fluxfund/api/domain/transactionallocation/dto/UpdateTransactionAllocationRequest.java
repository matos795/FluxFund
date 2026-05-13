package com.fluxfund.api.domain.transactionallocation.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record UpdateTransactionAllocationRequest(
        UUID fundId,
        UUID beneficiaryId,
        BigDecimal amount
) {
}
