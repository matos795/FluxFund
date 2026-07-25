package com.fluxfund.api.domain.auth.dto;

import java.util.List;
import java.util.UUID;

public record AuthenticatedUserResponse(
        UUID id,
        String name,
        String email,
        boolean platformAdmin,
        List<UserOrganizationResponse> organizations
) {
}