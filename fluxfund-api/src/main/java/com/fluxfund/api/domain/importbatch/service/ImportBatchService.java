package com.fluxfund.api.domain.importbatch.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fluxfund.api.domain.attachment.repository.AttachmentRepository;
import com.fluxfund.api.domain.audit.AuditAction;
import com.fluxfund.api.domain.audit.AuditEntityType;
import com.fluxfund.api.domain.audit.service.AuditLogService;
import com.fluxfund.api.domain.creditcardstatement.repository.CreditCardStatementPaymentRepository;
import com.fluxfund.api.domain.financialtransaction.FinancialTransaction;
import com.fluxfund.api.domain.financialtransaction.repository.FinancialTransactionRepository;
import com.fluxfund.api.domain.importbatch.ImportBatch;
import com.fluxfund.api.domain.importbatch.ImportBatchStatus;
import com.fluxfund.api.domain.importbatch.ImportBatchUndoBlocker;
import com.fluxfund.api.domain.importbatch.dto.ImportBatchResponse;
import com.fluxfund.api.domain.importbatch.dto.ImportBatchUndoCheckResponse;
import com.fluxfund.api.domain.importbatch.dto.ImportBatchUndoResponse;
import com.fluxfund.api.domain.importbatch.repository.ImportBatchRepository;
import com.fluxfund.api.domain.receipt.repository.ReceiptRepository;
import com.fluxfund.api.domain.transactionallocation.repository.TransactionAllocationRepository;
import com.fluxfund.api.security.OrganizationAccessService;
import com.fluxfund.api.shared.exception.BusinessException;
import com.fluxfund.api.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ImportBatchService {

    private final ImportBatchRepository importBatchRepository;
    private final OrganizationAccessService organizationAccessService;
    private final FinancialTransactionRepository financialTransactionRepository;
    private final TransactionAllocationRepository transactionAllocationRepository;
    private final AttachmentRepository attachmentRepository;
    private final ReceiptRepository receiptRepository;
    private final CreditCardStatementPaymentRepository creditCardStatementPaymentRepository;
    private final AuditLogService auditLogService;

    public Page<ImportBatchResponse> findAll(
            UUID organizationId,
            Pageable pageable) {

        organizationAccessService
                .requireReadAccess(
                        organizationId);

        return importBatchRepository
                .findAllByOrganizationId(
                        organizationId,
                        pageable)
                .map(this::toResponse);
    }

    public ImportBatchUndoCheckResponse checkUndo(
            UUID organizationId,
            UUID batchId) {

        organizationAccessService
                .requireReadAccess(
                        organizationId);

        ImportBatch batch = importBatchRepository
                .findByIdAndOrganizationId(
                        batchId,
                        organizationId)
                .orElseThrow(
                        () -> new ResourceNotFoundException(
                                "Import batch not found"));

        return buildUndoCheck(
                organizationId,
                batch);
    }

    @Transactional
    public ImportBatchUndoResponse undo(
            UUID organizationId,
            UUID batchId) {

        organizationAccessService
                .requireFinanceWriteAccess(
                        organizationId);

        ImportBatch batch = importBatchRepository
                .findByIdAndOrganizationIdForUpdate(
                        batchId,
                        organizationId)
                .orElseThrow(
                        () -> new ResourceNotFoundException(
                                "Import batch not found"));

        List<FinancialTransaction> transactions = financialTransactionRepository
                .findAllByOrganizationIdAndImportBatchIdForUpdate(
                        organizationId,
                        batchId);

        ImportBatchUndoCheckResponse undoCheck = buildUndoCheck(
                organizationId,
                batch);

        if (!undoCheck.canUndo()) {

            throw new BusinessException(
                    "Import batch cannot be undone. Blockers: "
                            + undoCheck.blockers());
        }

        int deletedTransactionCount = transactions.size();

        financialTransactionRepository
                .deleteAll(
                        transactions);

        financialTransactionRepository
                .flush();

        LocalDateTime undoneAt = LocalDateTime.now();

        batch.setStatus(
                ImportBatchStatus.UNDONE);

        batch.setUndoneAt(
                undoneAt);

        importBatchRepository.save(
                batch);

        auditLogService.record(
                organizationId,
                AuditEntityType.IMPORT_BATCH,
                batch.getId(),
                AuditAction.UNDO_IMPORT_BATCH,
                "Import batch %s undone: deletedTransactions=%d, source=%s, filename=%s"
                        .formatted(
                                batch.getId(),
                                deletedTransactionCount,
                                batch.getSourceType(),
                                batch.getOriginalFilename()));

        return new ImportBatchUndoResponse(
                batch.getId(),
                deletedTransactionCount,
                batch.getStatus(),
                batch.getUndoneAt());
    }

    private ImportBatchUndoCheckResponse buildUndoCheck(
            UUID organizationId,
            ImportBatch batch) {

        UUID batchId = batch.getId();

        long currentTransactionCount = financialTransactionRepository
                .countByOrganizationIdAndImportBatchId(
                        organizationId,
                        batchId);

        long modifiedTransactionCount = financialTransactionRepository
                .countModifiedByImportBatch(
                        organizationId,
                        batchId);

        long classifiedTransactionCount = financialTransactionRepository
                .countClassifiedByImportBatch(
                        organizationId,
                        batchId);

        long transferTransactionCount = financialTransactionRepository
                .countTransfersByImportBatch(
                        organizationId,
                        batchId);

        long allocationCount = transactionAllocationRepository
                .countByImportBatch(
                        organizationId,
                        batchId);

        long attachmentCount = attachmentRepository
                .countByImportBatch(
                        organizationId,
                        batchId);

        long receiptCount = receiptRepository
                .countByImportBatch(
                        organizationId,
                        batchId);

        long creditCardPaymentCount = creditCardStatementPaymentRepository
                .countByImportBatch(
                        organizationId,
                        batchId);

        long creditCardStatementLinkCount = financialTransactionRepository
                .countCreditCardStatementLinksByImportBatch(
                        organizationId,
                        batchId);

        List<ImportBatchUndoBlocker> blockers = new ArrayList<>();

        if (batch.getStatus() == ImportBatchStatus.UNDONE) {

            blockers.add(
                    ImportBatchUndoBlocker.ALREADY_UNDONE);

        } else {

            if (batch.getImportedCount() <= 0) {

                blockers.add(
                        ImportBatchUndoBlocker.NO_IMPORTED_TRANSACTIONS);
            }

            if (currentTransactionCount != batch.getImportedCount()) {

                blockers.add(
                        ImportBatchUndoBlocker.TRANSACTION_COUNT_MISMATCH);
            }

            if (modifiedTransactionCount > 0) {

                blockers.add(
                        ImportBatchUndoBlocker.MODIFIED_TRANSACTIONS);
            }

            if (classifiedTransactionCount > 0) {

                blockers.add(
                        ImportBatchUndoBlocker.CLASSIFIED_TRANSACTIONS);
            }

            if (transferTransactionCount > 0) {

                blockers.add(
                        ImportBatchUndoBlocker.TRANSFER_TRANSACTIONS);
            }

            if (allocationCount > 0) {

                blockers.add(
                        ImportBatchUndoBlocker.ALLOCATIONS);
            }

            if (attachmentCount > 0) {

                blockers.add(
                        ImportBatchUndoBlocker.ATTACHMENTS);
            }

            if (receiptCount > 0) {

                blockers.add(
                        ImportBatchUndoBlocker.RECEIPTS);
            }

            if (creditCardPaymentCount > 0) {

                blockers.add(
                        ImportBatchUndoBlocker.CREDIT_CARD_PAYMENTS);
            }

            if (creditCardStatementLinkCount > 0) {

                blockers.add(
                        ImportBatchUndoBlocker.CREDIT_CARD_STATEMENT_LINKS);
            }
        }

        boolean canUndo = blockers.isEmpty();

        return new ImportBatchUndoCheckResponse(
                batch.getId(),
                batch.getStatus(),
                batch.getImportedCount(),
                currentTransactionCount,
                modifiedTransactionCount,
                classifiedTransactionCount,
                transferTransactionCount,
                allocationCount,
                attachmentCount,
                receiptCount,
                creditCardPaymentCount,
                creditCardStatementLinkCount,
                canUndo,
                List.copyOf(blockers));
    }

    private ImportBatchResponse toResponse(
            ImportBatch batch) {

        return new ImportBatchResponse(
                batch.getId(),

                batch.getAccount().getId(),
                batch.getAccount().getName(),
                batch.getAccount().getBankName(),

                batch.getSourceType(),
                batch.getImportProfile(),
                batch.getOriginalFilename(),
                batch.getStatus(),

                batch.getImportedCount(),
                batch.getIgnoredDuplicatesCount(),
                batch.getFailedCount(),

                batch.getImportedAt(),
                batch.getUndoneAt());
    }
}