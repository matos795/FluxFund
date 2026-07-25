package com.fluxfund.api.domain.platform.organization.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreatePlatformOrganizationRequest(

        @NotBlank
        @Size(max = 150)
        String organizationName,

        @NotBlank
        @Size(max = 150)
        String ownerName,

        @NotBlank
        @Email
        @Size(max = 255)
        String ownerEmail

) {
}