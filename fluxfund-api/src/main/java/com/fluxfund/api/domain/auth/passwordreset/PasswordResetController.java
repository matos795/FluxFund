package com.fluxfund.api.domain.auth.passwordreset;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.fluxfund.api.domain.auth.passwordreset.dto.RequestPasswordResetRequest;
import com.fluxfund.api.domain.auth.passwordreset.dto.ResetPasswordRequest;
import com.fluxfund.api.domain.securityevent.RequestRateLimiterService;
import com.fluxfund.api.domain.securityevent.SecurityRequestMetadataResolver;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/public/password-reset")
@RequiredArgsConstructor
public class PasswordResetController {

    private final PasswordResetService service;
    private final SecurityRequestMetadataResolver metadataResolver;
    private final RequestRateLimiterService rateLimiterService;

    @PostMapping("/request")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void requestReset(
            @RequestBody @Valid RequestPasswordResetRequest request,

            HttpServletRequest httpRequest) {

        var metadata = metadataResolver.resolve(
                httpRequest);

        rateLimiterService
                .checkPasswordResetRequest(
                        metadata,
                        request.email());

        service.requestReset(
                request,
                metadata);
    }

    @PostMapping("/confirm")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resetPassword(
            @RequestBody @Valid ResetPasswordRequest request,

            HttpServletRequest httpRequest) {

        var metadata = metadataResolver.resolve(
                httpRequest);

        rateLimiterService
                .checkPasswordResetConfirmation(
                        metadata);

        service.resetPassword(
                request,
                metadata);
    }
}