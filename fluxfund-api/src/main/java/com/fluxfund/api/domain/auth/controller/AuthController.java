package com.fluxfund.api.domain.auth.controller;

import java.util.UUID;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fluxfund.api.domain.auth.dto.AuthenticatedUserResponse;
import com.fluxfund.api.domain.auth.dto.LoginRequest;
import com.fluxfund.api.domain.auth.dto.LoginResponse;
import com.fluxfund.api.domain.auth.service.AuthService;
import com.fluxfund.api.domain.securityevent.SecurityRequestMetadataResolver;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final SecurityRequestMetadataResolver metadataResolver;

    @PostMapping("/login")
    public LoginResponse login(
            @RequestBody @Valid LoginRequest request,

            HttpServletRequest httpRequest) {

        return authService.login(
                request,
                metadataResolver.resolve(
                        httpRequest));
    }

    @GetMapping("/me")
    public AuthenticatedUserResponse me(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return authService.me(userId);
    }
}