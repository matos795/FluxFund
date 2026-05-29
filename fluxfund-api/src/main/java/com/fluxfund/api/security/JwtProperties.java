package com.fluxfund.api.security;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Validated
@ConfigurationProperties(prefix = "app.security.jwt")
public record JwtProperties(

    @NotBlank
    String issuer,

    @NotNull
    Duration accessTokenExpiration,

    @NotBlank
    String secret
) {
}
