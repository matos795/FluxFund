package com.fluxfund.api.domain.fundtransfer.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

import com.fluxfund.api.domain.fund.dto.FundSummaryResponse;
import com.fluxfund.api.domain.fundtransfer.FundTransferStatus;

public record FundTransferResponse(
        UUID id,
        FundSummaryResponse sourceFund,
        FundSummaryResponse destinationFund,
        BigDecimal amount,
        LocalDate transferDate,
        String description,
        FundTransferStatus status,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
}