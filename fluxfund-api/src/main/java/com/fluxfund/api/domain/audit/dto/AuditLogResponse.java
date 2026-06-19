package com.fluxfund.api.domain.audit.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

import com.fluxfund.api.domain.audit.AuditAction;
import com.fluxfund.api.domain.audit.AuditEntityType;

public record AuditLogResponse(
        UUID id,
        UUID organizationId,
        UUID actorUserId,
        String actorName,
        String actorEmail,
        AuditEntityType entityType,
        UUID entityId,
        AuditAction action,
        String description,
        OffsetDateTime createdAt
) {
}