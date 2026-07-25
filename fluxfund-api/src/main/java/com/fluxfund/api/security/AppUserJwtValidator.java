package com.fluxfund.api.security;

import java.util.UUID;

import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2ErrorCodes;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import com.fluxfund.api.domain.user.AppUser;
import com.fluxfund.api.domain.user.AppUserRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class AppUserJwtValidator
        implements OAuth2TokenValidator<Jwt> {

    private final AppUserRepository
            appUserRepository;

    @Override
    public OAuth2TokenValidatorResult validate(
            Jwt jwt) {

        UUID userId;

        try {
            userId = UUID.fromString(
                    jwt.getSubject());

        } catch (
                IllegalArgumentException exception
        ) {
            return failure();
        }

        AppUser user =
                appUserRepository
                        .findByIdAndActiveTrue(
                                userId)
                        .orElse(null);

        if (user == null) {
            return failure();
        }

                Long tokenSessionVersion = null;
                Object sessionClaim = jwt.getClaim("session_version");

                if (sessionClaim instanceof Number) {
                        tokenSessionVersion = ((Number) sessionClaim).longValue();
                } else if (sessionClaim instanceof String) {
                        try {
                                tokenSessionVersion = Long.parseLong((String) sessionClaim);
                        } catch (NumberFormatException ex) {
                                tokenSessionVersion = null;
                        }
                }

        if (tokenSessionVersion == null
                || tokenSessionVersion
                        .intValue()
                != user.getSessionVersion()) {

            return failure();
        }

        return OAuth2TokenValidatorResult
                .success();
    }

    private OAuth2TokenValidatorResult failure() {

        OAuth2Error error =
                new OAuth2Error(
                        OAuth2ErrorCodes
                                .INVALID_TOKEN,

                        "The access token is no longer valid",

                        null);

        return OAuth2TokenValidatorResult
                .failure(error);
    }
}