package com.fluxfund.api.domain.report.dto.accountmovement;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import com.fluxfund.api.domain.financialtransaction.FinancialTransactionType;
import com.fluxfund.api.domain.financialtransaction.TransferDirection;

public record AccountMovementReportItemResponse(
        UUID transactionId,
        LocalDate settlementDate,
        FinancialTransactionType type,
        TransferDirection transferDirection,
        String description,
        String categoryName,
        String counterpartyAccountName,
        BigDecimal amount,
        BigDecimal signedAmount,
        BigDecimal runningBalance
) {
}