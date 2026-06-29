package com.fluxfund.api.domain.organization.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record OrganizationResponse(
        UUID id,
        String name,
        boolean active,

        String legalName,
        String cnpj,
        String contactEmail,
        String contactPhone,

        String addressLine,
        String addressNumber,
        String addressComplement,
        String neighborhood,
        String city,
        String state,
        String zipCode,

        String reviewerName,
        String reviewerTitle,
        String approverName,
        String approverTitle,

        OrganizationLogoResponse logo,

        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
}