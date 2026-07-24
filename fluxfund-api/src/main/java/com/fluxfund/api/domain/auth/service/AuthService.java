package com.fluxfund.api.domain.auth.service;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fluxfund.api.domain.auth.dto.AuthenticatedUserResponse;
import com.fluxfund.api.domain.auth.dto.LoginRequest;
import com.fluxfund.api.domain.auth.dto.LoginResponse;
import com.fluxfund.api.domain.auth.dto.UserOrganizationResponse;
import com.fluxfund.api.domain.organizationuser.OrganizationUserRepository;
import com.fluxfund.api.domain.user.AppUser;
import com.fluxfund.api.domain.user.AppUserRepository;
import com.fluxfund.api.security.FluxFundUserPrincipal;
import com.fluxfund.api.security.JwtTokenService;
import com.fluxfund.api.shared.exception.UnauthorizedException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final AppUserRepository appUserRepository;
    private final OrganizationUserRepository organizationUserRepository;
    private final JwtTokenService jwtTokenService;

    public LoginResponse login(LoginRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase(Locale.ROOT);

        Authentication authentication;

        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            normalizedEmail,
                            request.password()
                    )
            );
        } catch (AuthenticationException ex) {
            throw new UnauthorizedException("Invalid email or password");
        }

        FluxFundUserPrincipal principal =
                (FluxFundUserPrincipal) authentication.getPrincipal();

        String accessToken = jwtTokenService.generateAccessToken(principal);

        return new LoginResponse(
                accessToken,
                "Bearer",
                jwtTokenService.accessTokenExpirationSeconds(),
                findAuthenticatedUser(principal.id())
        );
    }

    public AuthenticatedUserResponse me(UUID userId) {
        return findAuthenticatedUser(userId);
    }

    private AuthenticatedUserResponse findAuthenticatedUser(UUID userId) {
        AppUser user = appUserRepository
                .findByIdAndActiveTrue(userId)
                .orElseThrow(() -> new UnauthorizedException("Authenticated user is no longer active"));

        List<UserOrganizationResponse> organizations = organizationUserRepository
                .findAllByUser_IdAndActiveTrueAndOrganization_ActiveTrue(userId)
                .stream()
                .map(membership -> new UserOrganizationResponse(
                        membership.getOrganization().getId(),
                        membership.getOrganization().getName(),
                        membership.getRole(),
                        membership.getOrganization().getLogoStorageKey() != null &&
                        !membership.getOrganization().getLogoStorageKey().isBlank()
                ))
                .toList();

        return new AuthenticatedUserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                organizations
        );
    }
}