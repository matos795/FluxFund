package com.fluxfund.api.domain.audit.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.fluxfund.api.domain.audit.AuditLog;

public interface AuditLogRepository extends
        JpaRepository<AuditLog, UUID>,
        JpaSpecificationExecutor<AuditLog> {
}