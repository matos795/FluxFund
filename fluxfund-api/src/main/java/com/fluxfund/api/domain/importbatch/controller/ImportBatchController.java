package com.fluxfund.api.domain.importbatch.controller;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fluxfund.api.domain.importbatch.dto.ImportBatchResponse;
import com.fluxfund.api.domain.importbatch.dto.ImportBatchUndoCheckResponse;
import com.fluxfund.api.domain.importbatch.service.ImportBatchService;

import lombok.RequiredArgsConstructor;

import static com.fluxfund.api.security.TenantHeaders.ORGANIZATION_ID;

@RestController
@RequestMapping("/api/v1/import-batches")
@RequiredArgsConstructor
public class ImportBatchController {

    private final ImportBatchService service;

    @GetMapping
    public ResponseEntity<Page<ImportBatchResponse>> findAll(
            @RequestHeader(ORGANIZATION_ID) UUID organizationId,

            @PageableDefault(size = 20, sort = "importedAt", direction = Sort.Direction.DESC) Pageable pageable) {

        return ResponseEntity.ok(
                service.findAll(
                        organizationId,
                        pageable));
    }

    @GetMapping("/{batchId}/undo-check")
    public ResponseEntity<ImportBatchUndoCheckResponse> checkUndo(
            @RequestHeader(ORGANIZATION_ID) UUID organizationId,
            @PathVariable UUID batchId) {

        return ResponseEntity.ok(
                service.checkUndo(
                        organizationId,
                        batchId));
    }
}