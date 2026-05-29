package com.fluxfund.api.domain.attachment.service;

import java.io.IOException;
import java.time.OffsetDateTime;
import java.util.List;
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
import com.fluxfund.api.domain.financialtransaction.FinancialTransaction;
import com.fluxfund.api.domain.financialtransaction.repository.FinancialTransactionRepository;
import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.domain.organization.OrganizationRepository;
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

    public AttachmentResponse upload(
            UUID organizationId,
            UUID transactionId,
            AttachmentType type,
            MultipartFile file) {

        if (file == null || file.isEmpty()) {
            throw new BusinessException("File is required");
        }

        Organization organization = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        FinancialTransaction transaction = financialTransactionRepository
                .findByIdAndOrganizationId(transactionId, organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Financial transaction not found"));

        String originalFileName = file.getOriginalFilename() != null
                ? file.getOriginalFilename()
                : "file";

        String safeFilename = sanitizeFilename(originalFileName);
        String storedFilename = UUID.randomUUID() + "-" + safeFilename;

        String storageKey = "organizations/%s/transactions/%s/%s"
                .formatted(organizationId, transactionId, storedFilename);

        try {
            storageService.save(storageKey, file.getInputStream());
        } catch (IOException exception) {
            throw new BusinessException("Could not process uploaded file");
        }

        Attachment attachment = new Attachment();
        attachment.setOrganization(organization);
        attachment.setFinancialTransaction(transaction);
        attachment.setType(type);
        attachment.setOriginalFilename(originalFileName);
        attachment.setContentType(file.getContentType());
        attachment.setSizeBytes(file.getSize());
        attachment.setStorageKey(storageKey);
        attachment.setUploadedAt(OffsetDateTime.now());

        attachmentRepository.save(attachment);

        return AttachmentMapper.toResponse(attachment);
    }

    @Transactional(readOnly = true)
    public List<AttachmentResponse> findAllByTransaction(
            UUID organizationId,
            UUID transactionId) {
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
        Attachment attachment = attachmentRepository
                .findByIdAndOrganizationId(attachmentId, organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment not found"));

        storageService.delete(attachment.getStorageKey());
        attachmentRepository.delete(attachment);
    }

    private String sanitizeFilename(String filename) {
        return filename
                .replace("\\", "_")
                .replace("/", "_")
                .replace("..", "_")
                .trim();
    }
}
