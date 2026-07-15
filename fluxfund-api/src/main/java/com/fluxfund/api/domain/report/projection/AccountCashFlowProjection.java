package com.fluxfund.api.domain.report.projection;

import java.math.BigDecimal;
import java.util.UUID;

public interface AccountCashFlowProjection {

    UUID getAccountId();

    String getAccountName();

    String getAccountType();

    String getBankName();

    BigDecimal getInitialBalance();

    BigDecimal getIncomeBefore();

    BigDecimal getExpenseBefore();

    BigDecimal getTransferBefore();

    BigDecimal getIncomeAmount();

    BigDecimal getExpenseAmount();

    BigDecimal getTransferAmount();

    BigDecimal getTransferOutAmount();

    BigDecimal getIncomeUntilToday();

    BigDecimal getExpenseUntilToday();

    BigDecimal getTransferUntilToday();

    Long getTransactionCount();
}