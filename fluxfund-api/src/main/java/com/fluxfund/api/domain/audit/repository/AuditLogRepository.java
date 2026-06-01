package com.fluxfund.api.domain.audit.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.fluxfund.api.domain.audit.AuditLog;

import java.util.UUID;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {
    
}