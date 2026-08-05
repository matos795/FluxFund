package com.fluxfund.api.domain.receipt.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

import com.fluxfund.api.domain.receipt.ReceiptDirection;
import com.fluxfund.api.domain.receipt.ReceiptSourceType;
import com.fluxfund.api.domain.receipt.ReceiptStatus;
import com.fluxfund.api.domain.receipt.ReceiptType;

public record ReceiptResponse(

        UUID id,

        UUID organizationId,

        ReceiptSourceType sourceType,

        UUID financialTransactionId,

        UUID transactionAllocationId,

        ReceiptType receiptType,

        ReceiptDirection direction,

        ReceiptStatus status,

        Integer sequenceYear,

        Long sequenceNumber,

        String receiptNumber,

        LocalDate issueDate,

        LocalDate paymentDate,

        BigDecimal amount,

        ReceiptPartySnapshotResponse counterparty,

        ReceiptPartySnapshotResponse beneficiary,

        UUID fundId,

        String fundName,

        String purposeDescription,

        String placeCity,

        String placeState,

        String signatoryName,

        String signatoryTitle,

        String notes,

        boolean fileAvailable,

        OffsetDateTime issuedAt,

        OffsetDateTime canceledAt,

        String cancellationReason,

        UUID replacesReceiptId,

        OffsetDateTime createdAt,

        OffsetDateTime updatedAt) {
}