package com.fluxfund.api.domain.creditcardstatement.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

import com.fluxfund.api.domain.account.dto.AccountSummaryResponse;
import com.fluxfund.api.domain.creditcardstatement.CreditCardStatementStatus;

public record CreditCardStatementResponse(

        UUID id,

        AccountSummaryResponse creditCardAccount,
        AccountSummaryResponse paymentAccount,

        UUID paymentTransactionId,

        String name,

        LocalDate closingDate,
        LocalDate dueDate,
        LocalDate paymentDate,

        CreditCardStatementStatus status,

        CreditCardStatementDocumentResponse statementDocument,

        BigDecimal totalAmount,
        long itemCount,

        OffsetDateTime createdAt,
        OffsetDateTime updatedAt) {

}
