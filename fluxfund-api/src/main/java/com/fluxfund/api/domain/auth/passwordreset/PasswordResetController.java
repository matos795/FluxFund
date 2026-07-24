package com.fluxfund.api.domain.auth.passwordreset;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.fluxfund.api.domain.auth.passwordreset.dto.RequestPasswordResetRequest;
import com.fluxfund.api.domain.auth.passwordreset.dto.ResetPasswordRequest;
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

    @PostMapping("/request")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void requestReset(
            @RequestBody @Valid RequestPasswordResetRequest request,

            HttpServletRequest httpRequest) {

        service.requestReset(
                request,

                metadataResolver.resolve(
                        httpRequest));
    }

    @PostMapping("/confirm")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resetPassword(
            @RequestBody @Valid ResetPasswordRequest request,

            HttpServletRequest httpRequest) {

        service.resetPassword(
                request,

                metadataResolver.resolve(
                        httpRequest));
    }
}