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

    BigDecimal getIncomeAmount();

    BigDecimal getExpenseAmount();

    BigDecimal getTransferNetBefore();

    BigDecimal getTransferInAmount();

    BigDecimal getTransferOutAmount();

    BigDecimal getTransferNetAmount();

    BigDecimal getTransferNetUntilToday();

    BigDecimal getIncomeUntilToday();

    BigDecimal getExpenseUntilToday();

    Long getTransactionCount();
}