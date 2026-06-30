package com.fluxfund.api.domain.report.dto.fund;

import java.math.BigDecimal;
import java.util.UUID;

public record FundMovementReportItemResponse(
        UUID fundId,
        String fundName,
        BigDecimal incomeAllocatedAmount,
        BigDecimal expenseAllocatedAmount,
        BigDecimal incomingTransferAmount,
        BigDecimal outgoingTransferAmount,
        BigDecimal netTransferAmount,
        BigDecimal netMovementAmount,
        long allocationCount
) {
}