package com.fluxfund.api.domain.platform.organization.dto;

import java.util.List;

import com.fluxfund.api.domain.organizationuser.dto.OrganizationUserResponse;
import com.fluxfund.api.domain.organizationuser.invitation.dto.OrganizationUserInvitationResponse;

public record PlatformOrganizationDetailsResponse(

        PlatformOrganizationResponse organization,

        List<OrganizationUserResponse> users,

        List<OrganizationUserInvitationResponse> invitations

) {
}