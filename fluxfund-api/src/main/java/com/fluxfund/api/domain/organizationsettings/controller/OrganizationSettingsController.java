package com.fluxfund.api.domain.organizationsettings.controller;

import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import com.fluxfund.api.domain.organizationsettings.dto.OrganizationSettingsResponse;
import com.fluxfund.api.domain.organizationsettings.dto.UpdateOrganizationSettingsRequest;
import com.fluxfund.api.domain.organizationsettings.service.OrganizationSettingsService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import static com.fluxfund.api.security.TenantHeaders.ORGANIZATION_ID;

@RestController
@RequiredArgsConstructor
public class OrganizationSettingsController {

    private final OrganizationSettingsService service;

    @GetMapping("/api/v1/organization-settings")
    public OrganizationSettingsResponse findByOrganization(
            @RequestHeader(ORGANIZATION_ID) UUID organizationId
    ) {
        return service.findByOrganization(organizationId);
    }

    @PutMapping("/api/v1/organization-settings")
    public OrganizationSettingsResponse update(
            @RequestHeader(ORGANIZATION_ID) UUID organizationId,
            @Valid @RequestBody UpdateOrganizationSettingsRequest request
    ) {
        return service.update(organizationId, request);
    }
}