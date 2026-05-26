package com.fluxfund.api.domain.attachment.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.fluxfund.api.domain.attachment.Attachment;

public interface AttachmentRepository extends JpaRepository<Attachment, UUID> {

    List<Attachment> findAllByFinancialTransactionIdAndOrganizationIdOrderByUploadedAtDesc(
            UUID financialTransactionId,
            UUID organizationId
    );

    Optional<Attachment> findByIdAndOrganizationId(
            UUID id,
            UUID organizationId
    );
}