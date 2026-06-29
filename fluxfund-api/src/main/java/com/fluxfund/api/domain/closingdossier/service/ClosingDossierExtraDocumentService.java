package com.fluxfund.api.domain.closingdossier.service;

import java.io.IOException;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.fluxfund.api.domain.audit.AuditAction;
import com.fluxfund.api.domain.audit.AuditEntityType;
import com.fluxfund.api.domain.audit.service.AuditLogService;
import com.fluxfund.api.domain.closingdossier.ClosingDossierExtraDocument;
import com.fluxfund.api.domain.closingdossier.ClosingDossierExtraDocumentType;
import com.fluxfund.api.domain.closingdossier.dto.ClosingDossierExtraDocumentFile;
import com.fluxfund.api.domain.closingdossier.dto.ClosingDossierExtraDocumentResponse;
import com.fluxfund.api.domain.closingdossier.mapper.ClosingDossierExtraDocumentMapper;
import com.fluxfund.api.domain.closingdossier.repository.ClosingDossierExtraDocumentRepository;
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
public class ClosingDossierExtraDocumentService {

    private static final long MAX_FILE_SIZE_BYTES = 10L * 1024 * 1024;
    private static final String PDF_EXTENSION = "pdf";
    private static final String PDF_CONTENT_TYPE = "application/pdf";

    private final ClosingDossierExtraDocumentRepository repository;
    private final OrganizationRepository organizationRepository;
    private final LocalFileStorageService storageService;
    private final OrganizationAccessService organizationAccessService;
    private final AuditLogService auditLogService;

    public ClosingDossierExtraDocumentResponse upload(
            UUID organizationId,
            LocalDate periodStartDate,
            LocalDate periodEndDate,
            ClosingDossierExtraDocumentType documentType,
            String title,
            Integer sortOrder,
            MultipartFile file) {

        organizationAccessService.requireFinanceWriteAccess(organizationId);

        validatePeriod(periodStartDate, periodEndDate);
        validateDocumentType(documentType);
        validateFile(file);

        String normalizedTitle = normalizeTitle(title);
        int resolvedSortOrder = resolveSortOrder(documentType, sortOrder);

        Organization organization = organizationRepository
                .findByIdAndActiveTrue(organizationId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Organization not found"));

        String storageKey =
                "organizations/%s/closing-dossier-extra-documents/%s_to_%s/%s.pdf"
                        .formatted(
                                organizationId,
                                periodStartDate,
                                periodEndDate,
                                UUID.randomUUID());

        try {
            storageService.save(storageKey, file.getInputStream());

            ClosingDossierExtraDocument document =
                    new ClosingDossierExtraDocument();

            document.setOrganization(organization);
            document.setPeriodStartDate(periodStartDate);
            document.setPeriodEndDate(periodEndDate);
            document.setDocumentType(documentType);
            document.setTitle(normalizedTitle);
            document.setOriginalFilename(
                    sanitizeFilename(file.getOriginalFilename()));
            document.setContentType(PDF_CONTENT_TYPE);
            document.setSizeBytes(file.getSize());
            document.setStorageKey(storageKey);
            document.setUploadedAt(OffsetDateTime.now());
            document.setSortOrder(resolvedSortOrder);

            repository.saveAndFlush(document);

            auditLogService.record(
                    organizationId,
                    AuditEntityType.CLOSING_DOSSIER_EXTRA_DOCUMENT,
                    document.getId(),
                    AuditAction.UPLOAD_CLOSING_DOSSIER_EXTRA_DOCUMENT,
                    "Closing dossier extra document uploaded: "
                            + documentType
                            + " - "
                            + normalizedTitle);

            return ClosingDossierExtraDocumentMapper.toResponse(document);

        } catch (IOException exception) {
            storageService.delete(storageKey);

            throw new BusinessException(
                    "Could not process uploaded closing dossier document");

        } catch (RuntimeException exception) {
            storageService.delete(storageKey);
            throw exception;
        }
    }

    @Transactional(readOnly = true)
    public List<ClosingDossierExtraDocumentResponse> findAllForPeriod(
            UUID organizationId,
            LocalDate periodStartDate,
            LocalDate periodEndDate) {

        organizationAccessService.requireReadAccess(organizationId);

        validatePeriod(periodStartDate, periodEndDate);

        return repository
                .findAllByOrganizationIdAndPeriodStartDateAndPeriodEndDateOrderBySortOrderAscUploadedAtAsc(
                        organizationId,
                        periodStartDate,
                        periodEndDate)
                .stream()
                .map(ClosingDossierExtraDocumentMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ClosingDossierExtraDocumentFile download(
            UUID organizationId,
            UUID documentId) {

        organizationAccessService.requireReadAccess(organizationId);

        ClosingDossierExtraDocument document = findDocument(
                organizationId,
                documentId);

        return new ClosingDossierExtraDocumentFile(
                document.getOriginalFilename(),
                document.getContentType(),
                storageService.read(document.getStorageKey()));
    }

    public void delete(UUID organizationId, UUID documentId) {
        organizationAccessService.requireFinanceWriteAccess(organizationId);

        ClosingDossierExtraDocument document = findDocument(
                organizationId,
                documentId);

        storageService.delete(document.getStorageKey());
        repository.delete(document);

        auditLogService.record(
                organizationId,
                AuditEntityType.CLOSING_DOSSIER_EXTRA_DOCUMENT,
                documentId,
                AuditAction.DELETE_CLOSING_DOSSIER_EXTRA_DOCUMENT,
                "Closing dossier extra document deleted: "
                        + document.getTitle());
    }

    private ClosingDossierExtraDocument findDocument(
            UUID organizationId,
            UUID documentId) {

        return repository
                .findByIdAndOrganizationId(documentId, organizationId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Closing dossier extra document not found"));
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

    private void validateDocumentType(
            ClosingDossierExtraDocumentType documentType) {

        if (documentType == null) {
            throw new BusinessException("Document type is required");
        }
    }

    private String normalizeTitle(String title) {
        if (title == null || title.isBlank()) {
            throw new BusinessException("Document title is required");
        }

        String normalized = title
                .replace("\r", " ")
                .replace("\n", " ")
                .trim();

        if (normalized.length() > 180) {
            throw new BusinessException(
                    "Document title must have at most 180 characters");
        }

        return normalized;
    }

    private int resolveSortOrder(
            ClosingDossierExtraDocumentType documentType,
            Integer sortOrder) {

        if (sortOrder != null) {
            if (sortOrder < 0) {
                throw new BusinessException(
                        "Sort order cannot be negative");
            }

            return sortOrder;
        }

        return switch (documentType) {
            case ACCOUNTS_PAYABLE_REPORT -> 10;
            case ACCOUNTS_RECEIVABLE_REPORT -> 20;
            case MISSIONARY_SUPPORT_REPORT -> 30;
            case CIELO_STATEMENT -> 40;
            case INVESTMENT_STATEMENT -> 50;
            case OTHER -> 99;
        };
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(
                    "Closing dossier extra document PDF is required");
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
                    "Only PDF files are allowed for closing dossier extra documents");
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
            return "closing-dossier-extra-document.pdf";
        }

        return sanitized.length() > 180
                ? sanitized.substring(0, 180)
                : sanitized;
    }

    private String getExtension(String filename) {
        int lastDotIndex = filename.lastIndexOf('.');

        if (lastDotIndex < 0 || lastDotIndex == filename.length() - 1) {
            return "";
        }

        return filename
                .substring(lastDotIndex + 1)
                .toLowerCase(Locale.ROOT);
    }
}