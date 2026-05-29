package com.fluxfund.api.security;

import java.util.UUID;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;

import com.fluxfund.api.shared.exception.UnauthorizedException;

@Service
public class CurrentUserService {

    public UUID requireUserId() {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (!(authentication instanceof JwtAuthenticationToken jwtAuthentication)
                || !authentication.isAuthenticated()) {
            throw new UnauthorizedException("Authentication is required");
        }

        String subject = jwtAuthentication.getToken().getSubject();

        try {
            return UUID.fromString(subject);
        } catch (IllegalArgumentException ex) {
            throw new UnauthorizedException("Invalid authenticated user");
        }
    }
}