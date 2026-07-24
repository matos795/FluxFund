package com.fluxfund.api.domain.securityevent;

import java.util.UUID;

import com.fluxfund.api.shared.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "security_event")
@Getter
@Setter
@NoArgsConstructor
public class SecurityEvent extends BaseEntity {

    @Column(name = "user_id")
    private UUID userId;

    @Column(length = 255)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(
            name = "event_type",
            nullable = false,
            length = 80)
    private SecurityEventType eventType;

    @Enumerated(EnumType.STRING)
    @Column(
            nullable = false,
            length = 20)
    private SecurityEventOutcome outcome;

    @Column(
            name = "ip_address",
            length = 64)
    private String ipAddress;

    @Column(
            name = "user_agent",
            length = 500)
    private String userAgent;

    @Column(columnDefinition = "TEXT")
    private String description;
}