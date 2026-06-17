package com.fluxfund.api.domain.organizationuser.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateOrganizationUserStatusRequest(
        @NotNull
        Boolean active
) {
}