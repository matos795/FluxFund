package com.fluxfund.api.domain.importbatch.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import com.fluxfund.api.domain.importbatch.ImportBatchStatus;

public record ImportBatchUndoResponse(
        UUID batchId,
        int deletedTransactionCount,
        ImportBatchStatus status,
        LocalDateTime undoneAt) {
}