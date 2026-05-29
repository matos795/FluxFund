package com.fluxfund.api.domain.attachment.dto;

import java.util.UUID;

public record AttachmentCountByTransactionProjection(
        UUID financialTransactionId,
        long totalCount,
        long paymentProofCount,
        long fiscalCount
) {
}