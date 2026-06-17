package com.fluxfund.api.domain.organizationuser.dto;

import com.fluxfund.api.domain.organizationuser.OrganizationRole;

import jakarta.validation.constraints.NotNull;

public record UpdateOrganizationUserRoleRequest(
        @NotNull
        OrganizationRole role
) {
}