package com.fluxfund.api.domain.report.dto.accountcashflow;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import com.fluxfund.api.domain.account.AccountType;

public record AccountCashFlowItemResponse(
        UUID accountId,
        String accountName,
        AccountType accountType,
        String bankName,
        LocalDate initialBalanceDate,
        BigDecimal openingBalance,
        BigDecimal initialBalanceInPeriod,
        BigDecimal incomeAmount,
        BigDecimal expenseAmount,
        BigDecimal transferInAmount,
        BigDecimal transferOutAmount,
        BigDecimal transferNetAmount,
        BigDecimal netAmount,
        BigDecimal closingBalance,
        BigDecimal currentBalance,
        long transactionCount) {
}