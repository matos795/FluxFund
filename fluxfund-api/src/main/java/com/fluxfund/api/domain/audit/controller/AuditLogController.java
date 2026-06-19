package com.fluxfund.api.domain.audit.controller;

import java.time.LocalDate;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.fluxfund.api.domain.audit.AuditAction;
import com.fluxfund.api.domain.audit.AuditEntityType;
import com.fluxfund.api.domain.audit.dto.AuditLogResponse;
import com.fluxfund.api.domain.audit.service.AuditLogService;

import lombok.RequiredArgsConstructor;

import static com.fluxfund.api.security.TenantHeaders.ORGANIZATION_ID;

@RestController
@RequestMapping("/api/v1/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogService service;

    @GetMapping
    public ResponseEntity<Page<AuditLogResponse>> findAll(
            @RequestHeader(ORGANIZATION_ID) UUID organizationId,

            @RequestParam(required = false) UUID actorUserId,

            @RequestParam(required = false) AuditEntityType entityType,

            @RequestParam(required = false) UUID entityId,

            @RequestParam(required = false) AuditAction action,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate,

            @PageableDefault(
                    size = 20,
                    sort = "createdAt",
                    direction = Sort.Direction.DESC
            )
            Pageable pageable
    ) {
        return ResponseEntity.ok(
                service.findAll(
                        organizationId,
                        actorUserId,
                        entityType,
                        entityId,
                        action,
                        startDate,
                        endDate,
                        pageable
                )
        );
    }
}