package com.fluxfund.api.domain.receipt.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import com.fluxfund.api.domain.receipt.ReceiptSourceType;
import com.fluxfund.api.domain.receipt.ReceiptType;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateReceiptDraftRequest(

        @NotNull ReceiptSourceType sourceType,

        UUID financialTransactionId,

        UUID transactionAllocationId,

        @NotNull ReceiptType receiptType,

        @DecimalMin("0.01") BigDecimal amount,

        LocalDate paymentDate,

        UUID counterpartyPartyId,

        @Size(max = 255) String counterpartyName,

        @Size(max = 50) String counterpartyDocument,

        @Size(max = 500) String counterpartyAddress,

        UUID beneficiaryPartyId,

        @Size(max = 255) String beneficiaryName,

        @Size(max = 50) String beneficiaryDocument,

        UUID fundId,

        @Size(max = 255) String fundName,

        @Size(max = 500) String purposeDescription,

        @Size(max = 255) String placeCity,

        @Size(max = 2) String placeState,

        @Size(max = 255) String signatoryName,

        @Size(max = 255) String signatoryTitle,

        @Size(max = 1000) String notes) {
}