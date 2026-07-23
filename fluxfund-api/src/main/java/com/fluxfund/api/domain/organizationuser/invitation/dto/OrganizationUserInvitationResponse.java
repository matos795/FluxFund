package com.fluxfund.api.domain.organizationuser.invitation.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

import com.fluxfund.api.domain.organizationuser.OrganizationRole;
import com.fluxfund.api.domain.organizationuser.invitation.OrganizationUserInvitationStatus;

public record OrganizationUserInvitationResponse(
        UUID id,
        String name,
        String email,
        OrganizationRole role,
        OrganizationUserInvitationStatus status,
        OffsetDateTime expiresAt,
        OffsetDateTime createdAt
) {
}