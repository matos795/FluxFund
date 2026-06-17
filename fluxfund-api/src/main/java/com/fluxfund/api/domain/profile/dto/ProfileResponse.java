package com.fluxfund.api.domain.profile.dto;

import java.util.UUID;

public record ProfileResponse(
        UUID id,
        String name,
        String email
) {
}