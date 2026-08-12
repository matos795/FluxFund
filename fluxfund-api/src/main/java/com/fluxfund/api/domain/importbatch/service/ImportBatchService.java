package com.fluxfund.api.domain.importbatch.service;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fluxfund.api.domain.importbatch.ImportBatch;
import com.fluxfund.api.domain.importbatch.dto.ImportBatchResponse;
import com.fluxfund.api.domain.importbatch.repository.ImportBatchRepository;
import com.fluxfund.api.security.OrganizationAccessService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ImportBatchService {

    private final ImportBatchRepository importBatchRepository;
    private final OrganizationAccessService organizationAccessService;

    public Page<ImportBatchResponse> findAll(
            UUID organizationId,
            Pageable pageable) {

        organizationAccessService
                .requireReadAccess(
                        organizationId);

        return importBatchRepository
                .findAllByOrganizationId(
                        organizationId,
                        pageable)
                .map(this::toResponse);
    }

    private ImportBatchResponse toResponse(
            ImportBatch batch) {

        return new ImportBatchResponse(
                batch.getId(),

                batch.getAccount().getId(),
                batch.getAccount().getName(),
                batch.getAccount().getBankName(),

                batch.getSourceType(),
                batch.getImportProfile(),
                batch.getOriginalFilename(),
                batch.getStatus(),

                batch.getImportedCount(),
                batch.getIgnoredDuplicatesCount(),
                batch.getFailedCount(),

                batch.getImportedAt(),
                batch.getUndoneAt());
    }
}