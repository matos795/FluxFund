package com.fluxfund.api.domain.organizationuser.invitation.dto;

import com.fluxfund.api.domain.organizationuser.OrganizationRole;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateOrganizationUserInvitationRequest(

        @NotBlank
        @Size(max = 150)
        String name,

        @NotBlank
        @Email
        @Size(max = 255)
        String email,

        @NotNull
        OrganizationRole role
) {
}