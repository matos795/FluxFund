package com.fluxfund.api.domain.auth.dto;

import java.util.UUID;

import com.fluxfund.api.domain.organizationuser.OrganizationRole;

public record UserOrganizationResponse(
        UUID id,
        String name,
        OrganizationRole role
) {
}