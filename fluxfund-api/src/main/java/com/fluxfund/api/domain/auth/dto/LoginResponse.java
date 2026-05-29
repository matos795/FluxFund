package com.fluxfund.api.domain.auth.dto;

public record LoginResponse(
        String accessToken,
        String tokenType,
        long expiresInSeconds,
        AuthenticatedUserResponse user
) {
}