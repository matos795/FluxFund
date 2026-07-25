package com.fluxfund.api.domain.platform.organization.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record PlatformOrganizationResponse(

        UUID id,

        String name,

        boolean active,

        String cnpj,

        String contactEmail,

        long totalUsers,

        long activeUsers,

        long pendingInvitations,

        OffsetDateTime createdAt

) {
}