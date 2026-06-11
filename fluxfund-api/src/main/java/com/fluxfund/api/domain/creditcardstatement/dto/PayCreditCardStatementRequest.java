package com.fluxfund.api.domain.creditcardstatement.dto;

import java.time.LocalDate;
import java.util.UUID;

import jakarta.validation.constraints.NotNull;

public record PayCreditCardStatementRequest(
        @NotNull
        UUID paymentAccountId,

        @NotNull
        LocalDate paymentDate,

        UUID paymentTransactionId
) {
}