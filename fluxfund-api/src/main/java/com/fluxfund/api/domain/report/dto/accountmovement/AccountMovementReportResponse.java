package com.fluxfund.api.domain.report.dto.accountmovement;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.fluxfund.api.domain.account.AccountType;

public record AccountMovementReportResponse(
        UUID accountId,
        String accountName,
        AccountType accountType,
        String bankName,
        LocalDate startDate,
        LocalDate endDate,
        BigDecimal openingBalance,
        BigDecimal incomeTotal,
        BigDecimal expenseTotal,
        BigDecimal transferInTotal,
        BigDecimal transferOutTotal,
        BigDecimal netMovement,
        BigDecimal closingBalance,
        long transactionCount,
        List<AccountMovementReportItemResponse> items
) {
}