package com.fluxfund.api.domain.attachment.service;

import java.io.IOException;
import java.io.InputStream;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.fluxfund.api.domain.attachment.Attachment;
import com.fluxfund.api.domain.attachment.AttachmentType;
import com.fluxfund.api.domain.attachment.dto.AttachmentFile;
import com.fluxfund.api.domain.attachment.dto.AttachmentResponse;
import com.fluxfund.api.domain.attachment.mapper.AttachmentMapper;
import com.fluxfund.api.domain.attachment.repository.AttachmentRepository;
import com.fluxfund.api.domain.audit.AuditAction;
import com.fluxfund.api.domain.audit.AuditEntityType;
import com.fluxfund.api.domain.audit.service.AuditLogService;
import com.fluxfund.api.domain.financialtransaction.FinancialTransaction;
import com.fluxfund.api.domain.financialtransaction.repository.FinancialTransactionRepository;
import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.domain.organization.repository.OrganizationRepository;
import com.fluxfund.api.security.OrganizationAccessService;
import com.fluxfund.api.shared.exception.BusinessException;
import com.fluxfund.api.shared.exception.ResourceNotFoundException;
import com.fluxfund.api.shared.storage.LocalFileStorageService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class AttachmentService {

        private final AttachmentRepository attachmentRepository;
        private final FinancialTransactionRepository financialTransactionRepository;
        private final OrganizationRepository organizationRepository;
        private final LocalFileStorageService storageService;
        private final OrganizationAccessService organizationAccessService;
        private final AuditLogService auditLogService;

        private static final long MAX_FILE_SIZE_BYTES = 10L * 1024 * 1024;

        private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
                        "pdf",
                        "png",
                        "jpg",
                        "jpeg");

        private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
                        "application/pdf",
                        "image/png",
                        "image/jpeg");

        public AttachmentResponse upload(
                        UUID organizationId,
                        UUID transactionId,
                        AttachmentType type,
                        MultipartFile file) {
                organizationAccessService.requireFinanceWriteAccess(organizationId);

                if (file == null || file.isEmpty()) {
                        throw new BusinessException("File is required");
                }

                validateFile(file);

                Organization organization = organizationRepository.findById(organizationId)
                                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

                FinancialTransaction transaction = financialTransactionRepository
                                .findByIdAndOrganizationId(transactionId, organizationId)
                                .orElseThrow(() -> new ResourceNotFoundException("Financial transaction not found"));

                String originalFileName = file.getOriginalFilename() != null
                                ? sanitizeFilename(file.getOriginalFilename())
                                : "file";

                String extension = getExtension(originalFileName);

                String storedFilename = UUID.randomUUID() + "." + extension;

                String storageKey = "organizations/%s/transactions/%s/%s"
                                .formatted(organizationId, transactionId, storedFilename);

                try {
                        storageService.save(storageKey, file.getInputStream());

                        Attachment attachment = new Attachment();
                        attachment.setOrganization(organization);
                        attachment.setFinancialTransaction(transaction);
                        attachment.setType(type);
                        attachment.setOriginalFilename(originalFileName);
                        attachment.setContentType(file.getContentType());
                        attachment.setSizeBytes(file.getSize());
                        attachment.setStorageKey(storageKey);
                        attachment.setUploadedAt(OffsetDateTime.now());

                        attachmentRepository.saveAndFlush(attachment);

                        auditLogService.record(
                                        organizationId,
                                        AuditEntityType.ATTACHMENT,
                                        attachment.getId(),
                                        AuditAction.UPLOAD_ATTACHMENT,
                                        "Attachment uploaded for transaction " + transactionId);

                        return AttachmentMapper.toResponse(attachment);
                } catch (IOException exception) {
                        storageService.delete(storageKey);
                        throw new BusinessException("Could not process uploaded file");
                } catch (RuntimeException exception) {
                        storageService.delete(storageKey);
                        throw exception;
                }
        }

        @Transactional(readOnly = true)
        public List<AttachmentResponse> findAllByTransaction(
                        UUID organizationId,
                        UUID transactionId) {
                organizationAccessService.requireReadAccess(organizationId);

                return attachmentRepository
                                .findAllByFinancialTransactionIdAndOrganizationIdOrderByUploadedAtDesc(
                                                transactionId,
                                                organizationId)
                                .stream()
                                .map(AttachmentMapper::toResponse)
                                .toList();
        }

        @Transactional(readOnly = true)
        public AttachmentFile download(UUID organizationId, UUID attachmentId) {
                organizationAccessService.requireReadAccess(organizationId);

                Attachment attachment = attachmentRepository
                                .findByIdAndOrganizationId(attachmentId, organizationId)
                                .orElseThrow(() -> new ResourceNotFoundException("Attachment not found"));

                byte[] content = storageService.read(attachment.getStorageKey());

                return new AttachmentFile(
                                attachment.getOriginalFilename(),
                                attachment.getContentType(),
                                content);
        }

        public void delete(UUID organizationId, UUID attachmentId) {
                organizationAccessService.requireFinanceWriteAccess(organizationId);

                Attachment attachment = attachmentRepository
                                .findByIdAndOrganizationId(attachmentId, organizationId)
                                .orElseThrow(() -> new ResourceNotFoundException("Attachment not found"));

                UUID transactionId = attachment.getFinancialTransaction().getId();
                storageService.delete(attachment.getStorageKey());
                attachmentRepository.delete(attachment);

                auditLogService.record(
                                organizationId,
                                AuditEntityType.ATTACHMENT,
                                attachmentId,
                                AuditAction.DELETE_ATTACHMENT,
                                "Attachment deleted from transaction " + transactionId);
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
                        return "file";
                }

                return sanitized.length() > 180
                                ? sanitized.substring(0, 180)
                                : sanitized;
        }

        private void validateFile(MultipartFile file) {
                if (file.getSize() > MAX_FILE_SIZE_BYTES) {
                        throw new BusinessException("File exceeds the maximum size of 10MB");
                }

                String originalFilename = file.getOriginalFilename();

                if (originalFilename == null || originalFilename.isBlank()) {
                        throw new BusinessException("Invalid file name");
                }

                String extension = getExtension(originalFilename);

                if (!ALLOWED_EXTENSIONS.contains(extension)) {
                        throw new BusinessException("Only PDF, PNG and JPG files are allowed");
                }

                String contentType = file.getContentType();

                if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase(Locale.ROOT))) {
                        throw new BusinessException("Invalid file type");
                }

                validateFileSignature(file, extension);
        }

        private String getExtension(String filename) {
                int lastDotIndex = filename.lastIndexOf('.');

                if (lastDotIndex < 0 || lastDotIndex == filename.length() - 1) {
                        throw new BusinessException("File extension is required");
                }

                return filename.substring(lastDotIndex + 1).toLowerCase(Locale.ROOT);
        }

        private void validateFileSignature(MultipartFile file, String extension) {
                try (InputStream inputStream = file.getInputStream()) {
                        byte[] header = inputStream.readNBytes(8);

                        boolean valid = switch (extension) {
                                case "pdf" -> startsWith(header, new byte[] { '%', 'P', 'D', 'F' });
                                case "png" -> startsWith(header, new byte[] {
                                                (byte) 0x89, 'P', 'N', 'G',
                                                (byte) 0x0D, (byte) 0x0A,
                                                (byte) 0x1A, (byte) 0x0A
                                });
                                case "jpg", "jpeg" -> startsWith(header, new byte[] {
                                                (byte) 0xFF, (byte) 0xD8, (byte) 0xFF
                                });
                                default -> false;
                        };

                        if (!valid) {
                                throw new BusinessException("File content does not match its extension");
                        }
                } catch (IOException exception) {
                        throw new BusinessException("Could not validate uploaded file");
                }
        }

        private boolean startsWith(byte[] content, byte[] expectedHeader) {
                if (content.length < expectedHeader.length) {
                        return false;
                }

                for (int index = 0; index < expectedHeader.length; index++) {
                        if (content[index] != expectedHeader[index]) {
                                return false;
                        }
                }

                return true;
        }
}
