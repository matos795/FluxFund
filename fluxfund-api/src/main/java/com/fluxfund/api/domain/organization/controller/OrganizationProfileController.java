package com.fluxfund.api.domain.organization.controller;

import static com.fluxfund.api.security.TenantHeaders.ORGANIZATION_ID;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.fluxfund.api.domain.organization.dto.OrganizationLogoFile;
import com.fluxfund.api.domain.organization.dto.OrganizationResponse;
import com.fluxfund.api.domain.organization.dto.UpdateOrganizationProfileRequest;
import com.fluxfund.api.domain.organization.service.OrganizationService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/organization-profile")
@RequiredArgsConstructor
public class OrganizationProfileController {

    private final OrganizationService service;

    @GetMapping
    public ResponseEntity<OrganizationResponse> findCurrent(
            @RequestHeader(ORGANIZATION_ID) UUID organizationId) {

        return ResponseEntity.ok(service.findCurrent(organizationId));
    }

    @PutMapping
    public ResponseEntity<OrganizationResponse> updateCurrent(
            @RequestHeader(ORGANIZATION_ID) UUID organizationId,
            @RequestBody @Valid UpdateOrganizationProfileRequest request) {

        return ResponseEntity.ok(service.updateCurrent(organizationId, request));
    }

    @PostMapping(value = "/logo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<OrganizationResponse> uploadLogo(
            @RequestHeader(ORGANIZATION_ID) UUID organizationId,
            @RequestParam("file") MultipartFile file) {

        return ResponseEntity.ok(
                service.uploadCurrentLogo(organizationId, file));
    }

    @GetMapping("/logo")
    public ResponseEntity<byte[]> downloadLogo(
            @RequestHeader(ORGANIZATION_ID) UUID organizationId) {

        OrganizationLogoFile file = service.downloadCurrentLogo(organizationId);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(file.contentType()))
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.inline()
                                .filename(
                                        file.filename(),
                                        StandardCharsets.UTF_8)
                                .build()
                                .toString())
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .header("X-Content-Type-Options", "nosniff")
                .body(file.content());
    }

    @DeleteMapping("/logo")
    public ResponseEntity<Void> deleteLogo(
            @RequestHeader(ORGANIZATION_ID) UUID organizationId) {

        service.deleteCurrentLogo(organizationId);

        return ResponseEntity.noContent().build();
    }
}