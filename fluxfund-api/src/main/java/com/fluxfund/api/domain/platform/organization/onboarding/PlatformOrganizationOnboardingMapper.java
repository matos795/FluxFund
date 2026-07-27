package com.fluxfund.api.domain.platform.organization.onboarding;

import com.fluxfund.api.domain.platform.organization.onboarding.dto.PlatformOrganizationOnboardingResponse;

public final class
        PlatformOrganizationOnboardingMapper {

    private PlatformOrganizationOnboardingMapper() {
    }

    public static PlatformOrganizationOnboardingResponse
            toResponse(

                    PlatformOrganizationOnboarding
                            onboarding) {

        return new PlatformOrganizationOnboardingResponse(
                onboarding.getId(),

                onboarding
                        .getOrganization()
                        .getId(),

                onboarding.getStatus(),
                onboarding.getPlanName(),
                onboarding.getMonthlyFee(),
                onboarding.getSetupFee(),
                onboarding.getContractStartDate(),
                onboarding.getBillingDueDay(),
                onboarding.isContractSigned(),
                onboarding.isCategoriesReviewed(),

                onboarding
                        .isDocumentationRulesReviewed(),

                onboarding
                        .isInitialImportValidated(),

                onboarding
                        .isTestReportValidated(),

                onboarding.isUsersTrained(),

                onboarding
                        .isInitialBackupConfirmed(),

                onboarding.isGoLiveApproved(),
                onboarding.getInternalNotes(),
                onboarding.getLaunchedAt(),
                onboarding.getCreatedAt(),
                onboarding.getUpdatedAt());
    }
}