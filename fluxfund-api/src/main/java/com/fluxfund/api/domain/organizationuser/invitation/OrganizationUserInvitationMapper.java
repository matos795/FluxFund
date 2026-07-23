package com.fluxfund.api.domain.organizationuser.invitation;

import java.time.OffsetDateTime;

import com.fluxfund.api.domain.organizationuser.invitation.dto.OrganizationUserInvitationResponse;

public final class OrganizationUserInvitationMapper {

    private OrganizationUserInvitationMapper() {
    }

    public static OrganizationUserInvitationResponse toResponse(OrganizationUserInvitation invitation) {

        return new OrganizationUserInvitationResponse(
                invitation.getId(),
                invitation.getName(),
                invitation.getEmail(),
                invitation.getRole(),
                resolveStatus(invitation),
                invitation.getExpiresAt(),
                invitation.getCreatedAt());
    }

    private static OrganizationUserInvitationStatus resolveStatus(OrganizationUserInvitation invitation) {

        if (invitation.getAcceptedAt() != null) {
            return OrganizationUserInvitationStatus.ACCEPTED;
        }

        if (invitation.getCanceledAt() != null) {
            return OrganizationUserInvitationStatus.CANCELED;
        }

        if (invitation.getExpiresAt()
                .isBefore(OffsetDateTime.now())) {

            return OrganizationUserInvitationStatus.EXPIRED;
        }

        return OrganizationUserInvitationStatus.PENDING;
    }
}