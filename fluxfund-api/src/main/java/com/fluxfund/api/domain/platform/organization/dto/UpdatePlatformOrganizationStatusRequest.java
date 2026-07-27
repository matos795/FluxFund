package com.fluxfund.api.domain.platform.organization.dto;

import jakarta.validation.constraints.NotNull;

public record UpdatePlatformOrganizationStatusRequest(

        @NotNull
        Boolean active

) {
}