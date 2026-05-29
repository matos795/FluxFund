package com.fluxfund.api.domain.organization.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record OrganizationResponse(
        UUID id,
        String name,
        boolean active,
        OffsetDateTime createdAt
) {
}