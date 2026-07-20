package com.fluxfund.api.domain.financialtransaction.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import com.fluxfund.api.domain.account.dto.AccountSummaryResponse;

public record TransferMatchCandidateResponse(

        UUID transactionId,

        AccountSummaryResponse account,

        LocalDate settlementDate,

        BigDecimal amount,

        String description,

        long dateDistanceDays

) {
}