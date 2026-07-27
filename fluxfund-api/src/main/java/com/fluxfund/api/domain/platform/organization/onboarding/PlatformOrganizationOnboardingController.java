package com.fluxfund.api.domain.platform.organization.onboarding;

import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fluxfund.api.domain.platform.organization.onboarding.dto.PlatformOrganizationOnboardingResponse;
import com.fluxfund.api.domain.platform.organization.onboarding.dto.UpdatePlatformOrganizationOnboardingRequest;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/platform/organizations/"
        + "{organizationId}/onboarding")
@RequiredArgsConstructor
public class PlatformOrganizationOnboardingController {

    private final PlatformOrganizationOnboardingService service;

    @GetMapping
    public PlatformOrganizationOnboardingResponse findByOrganization(
            @PathVariable UUID organizationId) {

        return service.findByOrganization(
                organizationId);
    }

    @PutMapping
    public PlatformOrganizationOnboardingResponse update(
            @PathVariable UUID organizationId,
            @RequestBody @Valid UpdatePlatformOrganizationOnboardingRequest request) {

        return service.update(
                organizationId,
                request);
    }
}