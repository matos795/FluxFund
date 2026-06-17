package com.fluxfund.api.domain.organization.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateOrganizationProfileRequest(
        @NotBlank
        @Size(max = 255)
        String name
) {
}