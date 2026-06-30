package com.fluxfund.api.domain.report.dto.fund;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record FundMovementReportResponse(
        LocalDate startDate,
        LocalDate endDate,
        BigDecimal incomeAllocatedTotal,
        BigDecimal expenseAllocatedTotal,
        BigDecimal incomingTransferTotal,
        BigDecimal outgoingTransferTotal,
        BigDecimal netMovementTotal,
        List<FundMovementReportItemResponse> items
) {
}