package com.fluxfund.api.domain.platform.organization.onboarding.dto;

import java.util.List;

public record PlatformOrganizationOnboardingReadinessResponse(

        boolean readyForLaunch,

        int completedBlockingRequirements,

        int totalBlockingRequirements,

        List<PlatformOrganizationOnboardingRequirementResponse>
                requirements

) {
}