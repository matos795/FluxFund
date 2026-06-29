package com.fluxfund.api.domain.organization.dto;

import java.time.OffsetDateTime;

public record OrganizationLogoResponse(
        String originalFilename,
        String contentType,
        Long sizeBytes,
        OffsetDateTime uploadedAt
) {
}