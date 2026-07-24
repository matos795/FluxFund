package com.fluxfund.api.domain.securityevent;

import java.util.Locale;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SecurityEventService {

    private final SecurityEventRepository repository;

    @Transactional(
            propagation =
                    Propagation.REQUIRES_NEW)
    public void record(
            UUID userId,
            String email,
            SecurityEventType eventType,
            SecurityEventOutcome outcome,
            SecurityRequestMetadata metadata,
            String description) {

        SecurityEvent securityEvent =
                new SecurityEvent();

        securityEvent.setUserId(userId);

        securityEvent.setEmail(
                normalizeEmail(email));

        securityEvent.setEventType(
                eventType);

        securityEvent.setOutcome(
                outcome);

        securityEvent.setIpAddress(
                metadata == null
                        ? null
                        : truncate(
                                metadata
                                        .ipAddress(),
                                64));

        securityEvent.setUserAgent(
                metadata == null
                        ? null
                        : truncate(
                                metadata
                                        .userAgent(),
                                500));

        securityEvent.setDescription(
                description);

        repository.save(
                securityEvent);
    }

    private String normalizeEmail(
            String email) {

        if (email == null
                || email.isBlank()) {

            return null;
        }

        return email
                .trim()
                .toLowerCase(
                        Locale.ROOT);
    }

    private String truncate(
            String value,
            int maximumLength) {

        if (value == null
                || value.length()
                <= maximumLength) {

            return value;
        }

        return value.substring(
                0,
                maximumLength);
    }
}