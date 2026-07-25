package com.fluxfund.api.domain.platform.organization.dto;

import com.fluxfund.api.domain.organizationuser.invitation.dto.CreateOrganizationUserInvitationResponse;

public record CreatePlatformOrganizationResponse(

        PlatformOrganizationResponse organization,

        CreateOrganizationUserInvitationResponse ownerInvitation

) {
}