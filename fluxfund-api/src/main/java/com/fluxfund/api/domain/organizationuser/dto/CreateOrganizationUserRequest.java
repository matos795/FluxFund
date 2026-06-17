package com.fluxfund.api.domain.organizationuser.dto;

import com.fluxfund.api.domain.organizationuser.OrganizationRole;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateOrganizationUserRequest(
        @NotBlank
        @Size(max = 255)
        String name,

        @NotBlank
        @Email
        @Size(max = 255)
        String email,

        @NotBlank
        @Size(min = 6, max = 100)
        String temporaryPassword,

        @NotNull
        OrganizationRole role
) {
}