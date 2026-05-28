package com.fluxfund.api.domain.attachment.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.fluxfund.api.domain.attachment.Attachment;

public interface AttachmentRepository extends JpaRepository<Attachment, UUID> {

        List<Attachment> findAllByFinancialTransactionIdAndOrganizationIdOrderByUploadedAtDesc(
                        UUID financialTransactionId,
                        UUID organizationId);

        Optional<Attachment> findByIdAndOrganizationId(
                        UUID id,
                        UUID organizationId);

        @Query("""
                        select a
                        from Attachment a
                        join fetch a.financialTransaction ft
                        where a.organization.id = :organizationId
                          and ft.id in :transactionIds
                        """)
        List<Attachment> findAllByTransactionIdsForExport(
                        @Param("organizationId") UUID organizationId,
                        @Param("transactionIds") List<UUID> transactionIds);
}