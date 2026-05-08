package com.fluxfund.api.domain.fund.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateFundRequest(
        @NotNull UUID organizationId,
        @NotBlank 
        @Size(max = 100) 
        String name,
        @Size(max = 1000) 
        String description,
        @NotNull 
        @Digits(integer = 15, fraction = 2) 
        BigDecimal initialBalance,
        LocalDate initialBalanceDate
    ) {

}
