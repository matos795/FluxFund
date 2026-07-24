package com.fluxfund.api.domain.audit.service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.fluxfund.api.domain.audit.AuditAction;
import com.fluxfund.api.domain.audit.AuditEntityType;
import com.fluxfund.api.domain.audit.AuditLog;
import com.fluxfund.api.domain.audit.dto.AuditLogResponse;
import com.fluxfund.api.domain.audit.repository.AuditLogRepository;
import com.fluxfund.api.domain.audit.repository.AuditLogSpecification;
import com.fluxfund.api.domain.user.AppUser;
import com.fluxfund.api.domain.user.AppUserRepository;
import com.fluxfund.api.security.CurrentUserService;
import com.fluxfund.api.security.OrganizationAccessService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuditLogService {

        private final AuditLogRepository repository;
        private final CurrentUserService currentUserService;
        private final OrganizationAccessService organizationAccessService;
        private final AppUserRepository appUserRepository;

        public void record(
                        UUID organizationId,
                        AuditEntityType entityType,
                        UUID entityId,
                        AuditAction action,
                        String description) {

                recordAs(
                                organizationId,
                                currentUserService.requireUserId(),
                                entityType,
                                entityId,
                                action,
                                description);
        }

        public void recordAs(
                        UUID organizationId,
                        UUID actorUserId,
                        AuditEntityType entityType,
                        UUID entityId,
                        AuditAction action,
                        String description) {

                AuditLog auditLog = new AuditLog();

                auditLog.setOrganizationId(
                                organizationId);

                auditLog.setActorUserId(
                                actorUserId);

                auditLog.setEntityType(
                                entityType);

                auditLog.setEntityId(
                                entityId);

                auditLog.setAction(
                                action);

                auditLog.setDescription(
                                description);

                repository.save(
                                auditLog);
        }

        public Page<AuditLogResponse> findAll(
                        UUID organizationId,
                        UUID actorUserId,
                        AuditEntityType entityType,
                        UUID entityId,
                        AuditAction action,
                        LocalDate startDate,
                        LocalDate endDate,
                        Pageable pageable) {
                organizationAccessService.requireAdminAccess(organizationId);

                OffsetDateTime createdAtFrom = startDate == null
                                ? null
                                : startDate
                                                .atStartOfDay(ZoneId.systemDefault())
                                                .toOffsetDateTime();

                OffsetDateTime createdAtTo = endDate == null
                                ? null
                                : endDate
                                                .plusDays(1)
                                                .atStartOfDay(ZoneId.systemDefault())
                                                .toOffsetDateTime();

                Page<AuditLog> auditLogs = repository.findAll(
                                AuditLogSpecification.withFilters(
                                                organizationId,
                                                actorUserId,
                                                entityType,
                                                entityId,
                                                action,
                                                createdAtFrom,
                                                createdAtTo),
                                pageable);

                Map<UUID, AppUser> usersById = appUserRepository
                                .findAllById(
                                                auditLogs.getContent()
                                                                .stream()
                                                                .map(AuditLog::getActorUserId)
                                                                .collect(Collectors.toSet()))
                                .stream()
                                .collect(Collectors.toMap(AppUser::getId, user -> user));

                return auditLogs.map(auditLog -> toResponse(
                                auditLog,
                                usersById.get(auditLog.getActorUserId())));
        }

        private AuditLogResponse toResponse(AuditLog auditLog, AppUser actor) {
                return new AuditLogResponse(
                                auditLog.getId(),
                                auditLog.getOrganizationId(),
                                auditLog.getActorUserId(),
                                actor == null ? null : actor.getName(),
                                actor == null ? null : actor.getEmail(),
                                auditLog.getEntityType(),
                                auditLog.getEntityId(),
                                auditLog.getAction(),
                                auditLog.getDescription(),
                                auditLog.getCreatedAt());
        }
}