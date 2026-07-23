package com.fluxfund.api.domain.organizationuser.invitation.dto;

public record CreateOrganizationUserInvitationResponse(
        OrganizationUserInvitationResponse invitation,
        String invitationUrl
) {
}