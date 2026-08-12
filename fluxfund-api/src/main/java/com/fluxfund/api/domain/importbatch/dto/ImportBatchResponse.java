package com.fluxfund.api.domain.importbatch.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import com.fluxfund.api.domain.importbatch.ImportBatchSourceType;
import com.fluxfund.api.domain.importbatch.ImportBatchStatus;

public record ImportBatchResponse(
        UUID id,

        UUID accountId,
        String accountName,
        String bankName,

        ImportBatchSourceType sourceType,
        String importProfile,
        String originalFilename,
        ImportBatchStatus status,

        int importedCount,
        int ignoredDuplicatesCount,
        int failedCount,

        LocalDateTime importedAt,
        LocalDateTime undoneAt
) {
}