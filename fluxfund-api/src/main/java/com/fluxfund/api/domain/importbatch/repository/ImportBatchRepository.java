package com.fluxfund.api.domain.importbatch.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.fluxfund.api.domain.importbatch.ImportBatch;

import jakarta.persistence.LockModeType;

public interface ImportBatchRepository
        extends JpaRepository<ImportBatch, UUID> {

    Optional<ImportBatch> findByIdAndOrganizationId(
            UUID id,
            UUID organizationId);

    @EntityGraph(attributePaths = {
            "account"
    })
    Page<ImportBatch> findAllByOrganizationId(
            UUID organizationId,
            Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select batch
            from ImportBatch batch
            where batch.id = :batchId
              and batch.organization.id = :organizationId
            """)
    Optional<ImportBatch> findByIdAndOrganizationIdForUpdate(
            @Param("batchId") UUID batchId,
            @Param("organizationId") UUID organizationId);
}