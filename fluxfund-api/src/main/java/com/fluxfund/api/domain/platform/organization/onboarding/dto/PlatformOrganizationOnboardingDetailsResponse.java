package com.fluxfund.api.domain.platform.organization.onboarding.dto;

public record PlatformOrganizationOnboardingDetailsResponse(

        PlatformOrganizationOnboardingResponse onboarding,

        PlatformOrganizationOnboardingReadinessResponse readiness

) {
}