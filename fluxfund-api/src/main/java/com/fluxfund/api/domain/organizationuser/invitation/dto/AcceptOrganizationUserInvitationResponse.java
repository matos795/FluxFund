package com.fluxfund.api.domain.organizationuser.invitation.dto;

import java.util.UUID;

public record AcceptOrganizationUserInvitationResponse(
        UUID organizationId,
        String organizationName,
        String email,
        String message
) {
}