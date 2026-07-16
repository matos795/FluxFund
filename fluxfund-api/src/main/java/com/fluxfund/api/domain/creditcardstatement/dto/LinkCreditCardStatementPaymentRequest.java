package com.fluxfund.api.domain.creditcardstatement.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;

public record LinkCreditCardStatementPaymentRequest(

        @NotNull
        UUID paymentAccountId,

        @NotNull
        UUID paymentTransactionId

) {
}