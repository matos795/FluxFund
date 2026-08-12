package com.fluxfund.api.domain.importbatch.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.fluxfund.api.domain.importbatch.ImportBatch;

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
}