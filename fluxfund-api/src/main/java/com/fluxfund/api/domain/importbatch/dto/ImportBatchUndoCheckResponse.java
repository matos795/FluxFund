package com.fluxfund.api.domain.importbatch.dto;

import java.util.List;
import java.util.UUID;

import com.fluxfund.api.domain.importbatch.ImportBatchStatus;
import com.fluxfund.api.domain.importbatch.ImportBatchUndoBlocker;

public record ImportBatchUndoCheckResponse(

        UUID batchId,

        ImportBatchStatus status,

        int importedCount,

        long currentTransactionCount,

        long modifiedTransactionCount,

        long classifiedTransactionCount,

        long transferTransactionCount,

        long allocationCount,

        long attachmentCount,

        long receiptCount,

        long creditCardPaymentCount,

        long creditCardStatementLinkCount,

        boolean canUndo,

        List<ImportBatchUndoBlocker> blockers

) {
}