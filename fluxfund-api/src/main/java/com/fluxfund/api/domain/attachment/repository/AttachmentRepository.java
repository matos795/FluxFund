package com.fluxfund.api.domain.attachment.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.fluxfund.api.domain.attachment.Attachment;
import com.fluxfund.api.domain.attachment.dto.AttachmentCountByTransactionProjection;

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

    @Query("""
            select new com.fluxfund.api.domain.attachment.dto.AttachmentCountByTransactionProjection(
                ft.id,
                count(a),
                sum(
                    case
                        when a.type = com.fluxfund.api.domain.attachment.AttachmentType.PROOF_OF_PAYMENT
                        then 1
                        else 0
                    end
                ),
                sum(
                    case
                        when a.type <> com.fluxfund.api.domain.attachment.AttachmentType.PROOF_OF_PAYMENT
                        then 1
                        else 0
                    end
                )
            )
            from Attachment a
            join a.financialTransaction ft
            where a.organization.id = :organizationId
              and ft.id in :transactionIds
            group by ft.id
            """)
    List<AttachmentCountByTransactionProjection> countByTransactionIds(
            @Param("organizationId") UUID organizationId,
            @Param("transactionIds") Collection<UUID> transactionIds);

    @Query("""
            select count(attachment)
            from Attachment attachment
            where attachment.organization.id = :organizationId
              and attachment.financialTransaction.importBatch.id = :batchId
            """)
    long countByImportBatch(
            @Param("organizationId") UUID organizationId,
            @Param("batchId") UUID batchId);
}