package com.fluxfund.api.domain.account.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import com.fluxfund.api.domain.account.AccountType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateAccountRequest(

        @NotBlank
        String name,

        @NotNull
        AccountType type,

        String bankCode,

        String bankName,

        String agency,

        String accountNumber,

        @NotNull
        BigDecimal initialBalance,

        LocalDate initialBalanceDate,

        @NotNull
        UUID organizationId
) {
}