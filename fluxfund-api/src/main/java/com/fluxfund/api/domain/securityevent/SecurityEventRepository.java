package com.fluxfund.api.domain.securityevent;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface SecurityEventRepository
        extends JpaRepository<
                SecurityEvent,
                UUID> {
}