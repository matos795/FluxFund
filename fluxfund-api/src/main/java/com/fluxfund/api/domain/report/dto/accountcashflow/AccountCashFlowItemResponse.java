package com.fluxfund.api.domain.report.dto.accountcashflow;

import java.math.BigDecimal;
import java.util.UUID;

import com.fluxfund.api.domain.account.AccountType;

public record AccountCashFlowItemResponse(
        UUID accountId,
        String accountName,
        AccountType accountType,
        String bankName,
        BigDecimal openingBalance,
        BigDecimal incomeAmount,
        BigDecimal expenseAmount,
        BigDecimal transferAmount,
        BigDecimal netAmount,
        BigDecimal closingBalance,
        long transactionCount
) {
}