package com.fluxfund.api.domain.creditcardstatement.service;

import java.io.IOException;
import java.time.OffsetDateTime;
import java.util.Locale;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.fluxfund.api.domain.audit.AuditAction;
import com.fluxfund.api.domain.audit.AuditEntityType;
import com.fluxfund.api.domain.audit.service.AuditLogService;
import com.fluxfund.api.domain.creditcardstatement.CreditCardStatement;
import com.fluxfund.api.domain.creditcardstatement.dto.CreditCardStatementDocumentFile;
import com.fluxfund.api.domain.creditcardstatement.dto.CreditCardStatementDocumentResponse;
import com.fluxfund.api.domain.creditcardstatement.repository.CreditCardStatementRepository;
import com.fluxfund.api.security.OrganizationAccessService;
import com.fluxfund.api.shared.exception.BusinessException;
import com.fluxfund.api.shared.exception.ResourceNotFoundException;
import com.fluxfund.api.shared.storage.LocalFileStorageService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CreditCardStatementDocumentService {

    private static final long MAX_FILE_SIZE_BYTES = 10L * 1024 * 1024;
    private static final String PDF_EXTENSION = "pdf";
    private static final String PDF_CONTENT_TYPE = "application/pdf";

    private final CreditCardStatementRepository statementRepository;
    private final LocalFileStorageService storageService;
    private final OrganizationAccessService organizationAccessService;
    private final AuditLogService auditLogService;

    public CreditCardStatementDocumentResponse upload(
            UUID organizationId,
            UUID statementId,
            MultipartFile file) {

        organizationAccessService.requireFinanceWriteAccess(organizationId);

        validateFile(file);

        CreditCardStatement statement = findStatement(
                organizationId,
                statementId);

        String storageKey =
                "organizations/%s/credit-card-statements/%s/official-statement/%s.pdf"
                        .formatted(
                                organizationId,
                                statementId,
                                UUID.randomUUID());

        String previousStorageKey = statement.getStatementPdfStorageKey();

        try {
            storageService.save(storageKey, file.getInputStream());

            statement.setStatementPdfOriginalFilename(
                    sanitizeFilename(file.getOriginalFilename()));

            statement.setStatementPdfContentType(PDF_CONTENT_TYPE);
            statement.setStatementPdfSizeBytes(file.getSize());
            statement.setStatementPdfStorageKey(storageKey);
            statement.setStatementPdfUploadedAt(OffsetDateTime.now());

            statementRepository.saveAndFlush(statement);

            auditLogService.record(
                    organizationId,
                    AuditEntityType.CREDIT_CARD_STATEMENT,
                    statementId,
                    AuditAction.UPLOAD_CREDIT_CARD_STATEMENT_PDF,
                    "Official PDF uploaded for credit card statement "
                            + statementId);

            deleteFileQuietly(previousStorageKey);

            return toResponse(statement);

        } catch (IOException exception) {
            deleteFileQuietly(storageKey);

            throw new BusinessException(
                    "Could not process uploaded credit card statement PDF");

        } catch (RuntimeException exception) {
            deleteFileQuietly(storageKey);
            throw exception;
        }
    }

    @Transactional(readOnly = true)
    public CreditCardStatementDocumentFile download(
            UUID organizationId,
            UUID statementId) {

        organizationAccessService.requireReadAccess(organizationId);

        CreditCardStatement statement = findStatement(
                organizationId,
                statementId);

        if (statement.getStatementPdfStorageKey() == null) {
            throw new ResourceNotFoundException(
                    "Credit card statement PDF not found");
        }

        return new CreditCardStatementDocumentFile(
                statement.getStatementPdfOriginalFilename(),
                statement.getStatementPdfContentType(),
                storageService.read(statement.getStatementPdfStorageKey()));
    }

    public void delete(
            UUID organizationId,
            UUID statementId) {

        organizationAccessService.requireFinanceWriteAccess(organizationId);

        CreditCardStatement statement = findStatement(
                organizationId,
                statementId);

        String storageKey = statement.getStatementPdfStorageKey();

        if (storageKey == null) {
            throw new ResourceNotFoundException(
                    "Credit card statement PDF not found");
        }

        statement.setStatementPdfOriginalFilename(null);
        statement.setStatementPdfContentType(null);
        statement.setStatementPdfSizeBytes(null);
        statement.setStatementPdfStorageKey(null);
        statement.setStatementPdfUploadedAt(null);

        statementRepository.saveAndFlush(statement);

        auditLogService.record(
                organizationId,
                AuditEntityType.CREDIT_CARD_STATEMENT,
                statementId,
                AuditAction.DELETE_CREDIT_CARD_STATEMENT_PDF,
                "Official PDF deleted from credit card statement "
                        + statementId);

        deleteFileQuietly(storageKey);
    }

    private CreditCardStatement findStatement(
            UUID organizationId,
            UUID statementId) {

        return statementRepository
                .findByIdAndOrganizationId(statementId, organizationId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Credit card statement not found"));
    }

    private CreditCardStatementDocumentResponse toResponse(
            CreditCardStatement statement) {

        return new CreditCardStatementDocumentResponse(
                statement.getStatementPdfOriginalFilename(),
                statement.getStatementPdfContentType(),
                statement.getStatementPdfSizeBytes(),
                statement.getStatementPdfUploadedAt());
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(
                    "Credit card statement PDF is required");
        }

        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new BusinessException(
                    "File exceeds the maximum size of 10MB");
        }

        String originalFilename = file.getOriginalFilename();

        if (originalFilename == null || originalFilename.isBlank()) {
            throw new BusinessException("Invalid file name");
        }

        if (!PDF_EXTENSION.equals(getExtension(originalFilename))) {
            throw new BusinessException(
                    "Only PDF files are allowed for credit card statements");
        }

        String contentType = file.getContentType();

        if (contentType == null
                || !PDF_CONTENT_TYPE.equals(
                        contentType.toLowerCase(Locale.ROOT))) {

            throw new BusinessException("Invalid file type");
        }

        validatePdfSignature(file);
    }

    private void validatePdfSignature(MultipartFile file) {
        try (var inputStream = file.getInputStream()) {
            byte[] header = inputStream.readNBytes(4);

            boolean isPdf = header.length == 4
                    && header[0] == '%'
                    && header[1] == 'P'
                    && header[2] == 'D'
                    && header[3] == 'F';

            if (!isPdf) {
                throw new BusinessException(
                        "File content does not match its PDF extension");
            }

        } catch (IOException exception) {
            throw new BusinessException(
                    "Could not validate uploaded PDF");
        }
    }

    private void deleteFileQuietly(String storageKey) {
        if (storageKey == null || storageKey.isBlank()) {
            return;
        }

        try {
            storageService.delete(storageKey);
        } catch (RuntimeException exception) {
            log.warn(
                    "Could not delete unused credit card statement file from storage: {}",
                    storageKey,
                    exception);
        }
    }

    private String sanitizeFilename(String filename) {
        String sanitized = filename
                .replace("\\", "_")
                .replace("/", "_")
                .replace("..", "_")
                .replace("\r", "_")
                .replace("\n", "_")
                .trim();

        if (sanitized.isBlank()) {
            return "credit-card-statement.pdf";
        }

        return sanitized.length() > 180
                ? sanitized.substring(0, 180)
                : sanitized;
    }

    private String getExtension(String filename) {
        int lastDotIndex = filename.lastIndexOf('.');

        if (lastDotIndex < 0 || lastDotIndex == filename.length() - 1) {
            throw new BusinessException("File extension is required");
        }

        return filename.substring(lastDotIndex + 1)
                .toLowerCase(Locale.ROOT);
    }
}