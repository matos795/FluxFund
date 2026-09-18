package com.fluxfund.api.domain.legal.dto;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Validated
@ConfigurationProperties(prefix = "app.legal")
public record LegalDocumentProperties(

        @Valid @NotNull Document terms,

        @Valid @NotNull Document privacyNotice) {

    public record Document(

            @NotBlank String version,

            @NotBlank String resource) {
    }
}