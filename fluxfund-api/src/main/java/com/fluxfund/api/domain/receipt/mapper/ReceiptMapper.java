package com.fluxfund.api.domain.receipt.mapper;

import com.fluxfund.api.domain.receipt.Receipt;
import com.fluxfund.api.domain.receipt.dto.ReceiptPartySnapshotResponse;
import com.fluxfund.api.domain.receipt.dto.ReceiptResponse;

public final class ReceiptMapper {

    private ReceiptMapper() {
    }

    public static ReceiptResponse toResponse(
            Receipt receipt) {

        return new ReceiptResponse(

                receipt.getId(),

                receipt
                        .getOrganization()
                        .getId(),

                receipt.getSourceType(),

                receipt.getFinancialTransaction() != null

                        ? receipt
                                .getFinancialTransaction()
                                .getId()

                        : null,

                receipt.getTransactionAllocation() != null

                        ? receipt
                                .getTransactionAllocation()
                                .getId()

                        : null,

                receipt.getReceiptType(),

                receipt
                        .getReceiptType()
                        .getDirection(),

                receipt.getStatus(),

                receipt.getSequenceYear(),

                receipt.getSequenceNumber(),

                formatReceiptNumber(
                        receipt),

                receipt.getIssueDate(),

                receipt.getPaymentDate(),

                receipt.getAmount(),

                new ReceiptPartySnapshotResponse(

                        receipt.getCounterpartyParty() != null

                                ? receipt
                                        .getCounterpartyParty()
                                        .getId()

                                : null,

                        receipt.getCounterpartyName(),

                        receipt.getCounterpartyDocument(),

                        receipt.getCounterpartyAddress()),

                receipt.getBeneficiaryName() != null

                        ? new ReceiptPartySnapshotResponse(

                                receipt.getBeneficiaryParty() != null

                                        ? receipt
                                                .getBeneficiaryParty()
                                                .getId()

                                        : null,

                                receipt.getBeneficiaryName(),

                                receipt.getBeneficiaryDocument(),

                                null)

                        : null,

                receipt.getFund() != null

                        ? receipt
                                .getFund()
                                .getId()

                        : null,

                receipt.getFundName(),

                receipt.getPurposeDescription(),

                receipt.getPlaceCity(),

                receipt.getPlaceState(),

                receipt.getSignatoryName(),

                receipt.getSignatoryTitle(),

                receipt.getNotes(),

                receipt.getPdfStorageKey() != null,

                receipt.getIssuedAt(),

                receipt.getCanceledAt(),

                receipt.getCancellationReason(),

                receipt.getReplacesReceipt() != null

                        ? receipt
                                .getReplacesReceipt()
                                .getId()

                        : null,

                receipt.getCreatedAt(),

                receipt.getUpdatedAt());
    }

    private static String formatReceiptNumber(
            Receipt receipt) {

        if (receipt.getSequenceYear() == null
                || receipt.getSequenceNumber() == null) {

            return null;
        }

        return "REC-%d-%06d"
                .formatted(

                        receipt.getSequenceYear(),

                        receipt.getSequenceNumber());
    }
}