package com.fluxfund.api.domain.organizationuser.invitation.dto;

import java.time.OffsetDateTime;

import com.fluxfund.api.domain.organizationuser.OrganizationRole;

public record OrganizationUserInvitationDetailsResponse(
        String organizationName,
        String invitedName,
        String email,
        OrganizationRole role,
        OffsetDateTime expiresAt,
        boolean requiresPassword
) {
}