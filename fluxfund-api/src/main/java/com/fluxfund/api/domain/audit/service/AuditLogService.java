package com.fluxfund.api.domain.audit.service;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.fluxfund.api.domain.audit.AuditAction;
import com.fluxfund.api.domain.audit.AuditEntityType;
import com.fluxfund.api.domain.audit.AuditLog;
import com.fluxfund.api.domain.audit.repository.AuditLogRepository;
import com.fluxfund.api.security.CurrentUserService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository repository;
    private final CurrentUserService currentUserService;

    public void record(
            UUID organizationId,
            AuditEntityType entityType,
            UUID entityId,
            AuditAction action,
            String description) {

        AuditLog auditLog = new AuditLog();
        auditLog.setOrganizationId(organizationId);
        auditLog.setActorUserId(currentUserService.requireUserId());
        auditLog.setEntityType(entityType);
        auditLog.setEntityId(entityId);
        auditLog.setAction(action);
        auditLog.setDescription(description);

        repository.save(auditLog);
    }
}