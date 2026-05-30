package com.fluxfund.api.security;

import java.util.UUID;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;

import com.fluxfund.api.domain.user.AppUserRepository;
import com.fluxfund.api.shared.exception.UnauthorizedException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CurrentUserService {

    private final AppUserRepository appUserRepository;

    public UUID requireUserId() {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (!(authentication instanceof JwtAuthenticationToken jwtAuthentication)
                || !authentication.isAuthenticated()) {
            throw new UnauthorizedException("Authentication is required");
        }

        UUID userId = parseUserId(jwtAuthentication.getToken().getSubject());

        appUserRepository.findByIdAndActiveTrue(userId)
                .orElseThrow(() ->
                        new UnauthorizedException("Authenticated user is no longer active"));

        return userId;
    }

    private UUID parseUserId(String subject) {
        try {
            return UUID.fromString(subject);
        } catch (IllegalArgumentException ex) {
            throw new UnauthorizedException("Invalid authenticated user");
        }
    }
}