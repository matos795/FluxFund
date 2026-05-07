package com.fluxfund.api.domain.account.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.fluxfund.api.domain.account.AccountType;

public record UpdateAccountRequest(

        String name,

        AccountType type,

        String bankCode,

        String bankName,

        String agency,

        String accountNumber,

        BigDecimal initialBalance,

        LocalDate initialBalanceDate,

        Boolean active
) {
}