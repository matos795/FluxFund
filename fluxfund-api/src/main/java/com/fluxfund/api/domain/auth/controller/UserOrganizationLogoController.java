package com.fluxfund.api.domain.auth.controller;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fluxfund.api.domain.organization.dto.OrganizationLogoFile;
import com.fluxfund.api.domain.organization.service.OrganizationService;
import com.fluxfund.api.security.OrganizationAccessService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/user-organizations")
@RequiredArgsConstructor
public class UserOrganizationLogoController {

    private final OrganizationService organizationService;

    private final OrganizationAccessService
            organizationAccessService;

    @GetMapping("/{organizationId}/logo")
    public ResponseEntity<byte[]> downloadLogo(
            @PathVariable UUID organizationId) {

        /*
         * Não usamos o header da organização aqui,
         * mas ainda validamos se o usuário autenticado
         * possui acesso a ela.
         */
        organizationAccessService
                .requireReadAccess(organizationId);

        OrganizationLogoFile file = organizationService.downloadCurrentLogo(organizationId);

        return ResponseEntity.ok()
                .contentType(
                        MediaType.parseMediaType(
                                file.contentType()))
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.inline()
                                .filename(
                                        file.filename(),
                                        StandardCharsets.UTF_8)
                                .build()
                                .toString())
                .body(file.content());
    }
}