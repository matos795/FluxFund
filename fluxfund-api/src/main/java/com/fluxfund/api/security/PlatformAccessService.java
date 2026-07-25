package com.fluxfund.api.security;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.fluxfund.api.domain.user.AppUser;
import com.fluxfund.api.domain.user.AppUserRepository;
import com.fluxfund.api.shared.exception.ForbiddenException;
import com.fluxfund.api.shared.exception.UnauthorizedException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PlatformAccessService {

    private final CurrentUserService currentUserService;

    private final AppUserRepository appUserRepository;

    public AppUser requirePlatformAdmin() {

        UUID currentUserId = currentUserService
                .requireUserId();

        AppUser user = appUserRepository
                .findByIdAndActiveTrue(
                        currentUserId)

                .orElseThrow(
                        () -> new UnauthorizedException(
                                "Authenticated user is no longer active"));

        if (!user.isPlatformAdmin()) {
            throw new ForbiddenException(
                    "Platform administrator access is required");
        }

        return user;
    }
}