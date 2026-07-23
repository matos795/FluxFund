package com.fluxfund.api.domain.organizationuser.invitation.dto;

import jakarta.validation.constraints.Size;

public record AcceptOrganizationUserInvitationRequest(

        @Size(max = 150)
        String name,

        @Size(max = 100)
        String password
) {
}