package com.fluxfund.api.domain.organization.controller;

import static com.fluxfund.api.security.TenantHeaders.ORGANIZATION_ID;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
}