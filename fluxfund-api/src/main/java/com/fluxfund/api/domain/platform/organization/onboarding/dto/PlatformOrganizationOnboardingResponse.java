package com.fluxfund.api.domain.platform.organization.onboarding.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

import com.fluxfund.api.domain.platform.organization.onboarding.PlatformOrganizationOnboardingStatus;

public record PlatformOrganizationOnboardingResponse(

        UUID id,

        UUID organizationId,

        PlatformOrganizationOnboardingStatus status,

        String planName,

        BigDecimal monthlyFee,

        BigDecimal setupFee,

        LocalDate contractStartDate,

        Integer billingDueDay,

        boolean contractSigned,

        boolean categoriesReviewed,

        boolean documentationRulesReviewed,

        boolean initialImportValidated,

        boolean testReportValidated,

        boolean usersTrained,

        boolean initialBackupConfirmed,

        boolean goLiveApproved,

        String internalNotes,

        OffsetDateTime launchedAt,

        OffsetDateTime createdAt,

        OffsetDateTime updatedAt

) {
}