package com.fluxfund.api.domain.organizationuser.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

import com.fluxfund.api.domain.organizationuser.OrganizationRole;

public record OrganizationUserResponse(
        UUID userId,
        String name,
        String email,
        OrganizationRole role,
        boolean active,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
}