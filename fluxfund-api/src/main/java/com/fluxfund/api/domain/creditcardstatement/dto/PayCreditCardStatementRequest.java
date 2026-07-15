package com.fluxfund.api.domain.creditcardstatement.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

public record PayCreditCardStatementRequest(

        @NotNull
        UUID paymentAccountId,

        @NotNull
        LocalDate paymentDate,

        @NotNull
        @DecimalMin(
                value = "0.01",
                message = "Payment amount must be greater than zero")
        @Digits(
                integer = 13,
                fraction = 2)
        BigDecimal amount,

        UUID paymentTransactionId

) {
}