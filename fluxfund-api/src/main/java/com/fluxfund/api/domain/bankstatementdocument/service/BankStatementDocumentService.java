package com.fluxfund.api.domain.bankstatementdocument.service;

import java.io.IOException;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.fluxfund.api.domain.account.Account;
import com.fluxfund.api.domain.account.AccountType;
import com.fluxfund.api.domain.account.repository.AccountRepository;
import com.fluxfund.api.domain.audit.AuditAction;
import com.fluxfund.api.domain.audit.AuditEntityType;
import com.fluxfund.api.domain.audit.service.AuditLogService;
import com.fluxfund.api.domain.bankstatementdocument.BankStatementDocument;
import com.fluxfund.api.domain.bankstatementdocument.dto.BankStatementDocumentFile;
import com.fluxfund.api.domain.bankstatementdocument.dto.BankStatementDocumentResponse;
import com.fluxfund.api.domain.bankstatementdocument.mapper.BankStatementDocumentMapper;
import com.fluxfund.api.domain.bankstatementdocument.repository.BankStatementDocumentRepository;
import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.domain.organization.OrganizationRepository;
import com.fluxfund.api.security.OrganizationAccessService;
import com.fluxfund.api.shared.exception.BusinessException;
import com.fluxfund.api.shared.exception.ResourceNotFoundException;
import com.fluxfund.api.shared.storage.LocalFileStorageService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class BankStatementDocumentService {

    private static final long MAX_FILE_SIZE_BYTES = 10L * 1024 * 1024;
    private static final String PDF_EXTENSION = "pdf";
    private static final String PDF_CONTENT_TYPE = "application/pdf";

    private final BankStatementDocumentRepository bankStatementDocumentRepository;
    private final OrganizationRepository organizationRepository;
    private final AccountRepository accountRepository;
    private final LocalFileStorageService storageService;
    private final OrganizationAccessService organizationAccessService;
    private final AuditLogService auditLogService;

    public BankStatementDocumentResponse upload(
            UUID organizationId,
            UUID accountId,
            LocalDate periodStartDate,
            LocalDate periodEndDate,
            MultipartFile file) {

        organizationAccessService.requireFinanceWriteAccess(organizationId);

        validatePeriod(periodStartDate, periodEndDate);
        validateFile(file);

        Organization organization = organizationRepository
                .findByIdAndActiveTrue(organizationId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Organization not found"));

        Account account = accountRepository
                .findByIdAndOrganizationIdAndActiveTrue(accountId, organizationId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Account not found"));

        if (account.getType() == AccountType.CREDIT_CARD) {
            throw new BusinessException(
                    "Credit card accounts are not supported for bank statement documents in this MVP");
        }

        String originalFilename = sanitizeFilename(file.getOriginalFilename());

        String storageKey =
                "organizations/%s/bank-statements/%s/%s_to_%s/%s.pdf"
                        .formatted(
                                organizationId,
                                accountId,
                                periodStartDate,
                                periodEndDate,
                                UUID.randomUUID());

        try {
            storageService.save(storageKey, file.getInputStream());

            BankStatementDocument document = new BankStatementDocument();
            document.setOrganization(organization);
            document.setAccount(account);
            document.setPeriodStartDate(periodStartDate);
            document.setPeriodEndDate(periodEndDate);
            document.setOriginalFilename(originalFilename);
            document.setContentType(PDF_CONTENT_TYPE);
            document.setSizeBytes(file.getSize());
            document.setStorageKey(storageKey);
            document.setUploadedAt(OffsetDateTime.now());

            bankStatementDocumentRepository.saveAndFlush(document);

            auditLogService.record(
                    organizationId,
                    AuditEntityType.BANK_STATEMENT_DOCUMENT,
                    document.getId(),
                    AuditAction.UPLOAD_BANK_STATEMENT_DOCUMENT,
                    "Bank statement document uploaded for account " + accountId);

            return BankStatementDocumentMapper.toResponse(document);

        } catch (IOException exception) {
            storageService.delete(storageKey);
            throw new BusinessException(
                    "Could not process uploaded bank statement PDF");

        } catch (RuntimeException exception) {
            storageService.delete(storageKey);
            throw exception;
        }
    }

    @Transactional(readOnly = true)
    public List<BankStatementDocumentResponse> findAllForAccountAndPeriod(
            UUID organizationId,
            UUID accountId,
            LocalDate periodStartDate,
            LocalDate periodEndDate) {

        organizationAccessService.requireReadAccess(organizationId);
        validatePeriod(periodStartDate, periodEndDate);

        accountRepository
                .findByIdAndOrganizationIdAndActiveTrue(accountId, organizationId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Account not found"));

        return bankStatementDocumentRepository
                .findAllForAccountAndOverlappingPeriod(
                        organizationId,
                        accountId,
                        periodStartDate,
                        periodEndDate)
                .stream()
                .map(BankStatementDocumentMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public BankStatementDocumentFile download(
            UUID organizationId,
            UUID documentId) {

        organizationAccessService.requireReadAccess(organizationId);

        BankStatementDocument document = bankStatementDocumentRepository
                .findByIdAndOrganizationId(documentId, organizationId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Bank statement document not found"));

        return new BankStatementDocumentFile(
                document.getOriginalFilename(),
                document.getContentType(),
                storageService.read(document.getStorageKey()));
    }

    public void delete(UUID organizationId, UUID documentId) {
        organizationAccessService.requireFinanceWriteAccess(organizationId);

        BankStatementDocument document = bankStatementDocumentRepository
                .findByIdAndOrganizationId(documentId, organizationId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Bank statement document not found"));

        UUID accountId = document.getAccount().getId();

        storageService.delete(document.getStorageKey());
        bankStatementDocumentRepository.delete(document);

        auditLogService.record(
                organizationId,
                AuditEntityType.BANK_STATEMENT_DOCUMENT,
                documentId,
                AuditAction.DELETE_BANK_STATEMENT_DOCUMENT,
                "Bank statement document deleted from account " + accountId);
    }

    private void validatePeriod(
            LocalDate periodStartDate,
            LocalDate periodEndDate) {

        if (periodStartDate == null || periodEndDate == null) {
            throw new BusinessException(
                    "Period start date and end date are required");
        }

        if (periodStartDate.isAfter(periodEndDate)) {
            throw new BusinessException(
                    "Period start date cannot be after period end date");
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("Bank statement PDF is required");
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
                    "Only PDF files are allowed for bank statements");
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

    private String sanitizeFilename(String filename) {
        String sanitized = filename
                .replace("\\", "_")
                .replace("/", "_")
                .replace("..", "_")
                .replace("\r", "_")
                .replace("\n", "_")
                .trim();

        if (sanitized.isBlank()) {
            return "bank-statement.pdf";
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