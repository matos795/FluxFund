package com.fluxfund.api.domain.creditcardstatement.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

import com.fluxfund.api.domain.account.dto.AccountSummaryResponse;

public record CreditCardStatementPaymentResponse(

        UUID id,

        AccountSummaryResponse paymentAccount,

        UUID paymentTransactionId,

        LocalDate paymentDate,

        BigDecimal amount,

        String description,

        boolean linked,

        OffsetDateTime createdAt

) {
}