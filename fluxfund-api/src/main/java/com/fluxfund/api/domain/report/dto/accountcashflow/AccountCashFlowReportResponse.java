package com.fluxfund.api.domain.report.dto.accountcashflow;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record AccountCashFlowReportResponse(
                LocalDate startDate,
                LocalDate endDate,
                BigDecimal openingBalanceTotal,
                BigDecimal incomeTotal,
                BigDecimal expenseTotal,
                BigDecimal transferInTotal,
                BigDecimal transferOutTotal,
                BigDecimal transferNetTotal,
                BigDecimal netTotal,
                BigDecimal closingBalanceTotal,
                BigDecimal currentBalanceTotal,
                long transactionCount,
                List<AccountCashFlowItemResponse> items) {
}