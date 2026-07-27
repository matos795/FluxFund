package com.fluxfund.api.domain.platform.organization.onboarding.dto;

import com.fluxfund.api.domain.platform.organization.onboarding.PlatformOrganizationOnboardingRequirementKey;

public record PlatformOrganizationOnboardingRequirementResponse(

        PlatformOrganizationOnboardingRequirementKey key,

        String title,

        boolean completed,

        boolean blocking,

        String detail

) {
}