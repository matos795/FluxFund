package com.fluxfund.api.domain.platform.organization.onboarding.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.fluxfund.api.domain.platform.organization.onboarding.PlatformOrganizationOnboardingStatus;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdatePlatformOrganizationOnboardingRequest(

        @NotNull
        PlatformOrganizationOnboardingStatus status,

        @Size(max = 100)
        String planName,

        @DecimalMin("0.00")
        @Digits(
                integer = 15,
                fraction = 2)
        BigDecimal monthlyFee,

        @DecimalMin("0.00")
        @Digits(
                integer = 15,
                fraction = 2)
        BigDecimal setupFee,

        LocalDate contractStartDate,

        @Min(1)
        @Max(28)
        Integer billingDueDay,

        @NotNull
        Boolean contractSigned,

        @NotNull
        Boolean categoriesReviewed,

        @NotNull
        Boolean documentationRulesReviewed,

        @NotNull
        Boolean initialImportValidated,

        @NotNull
        Boolean testReportValidated,

        @NotNull
        Boolean usersTrained,

        @NotNull
        Boolean initialBackupConfirmed,

        @NotNull
        Boolean goLiveApproved,

        @Size(max = 5000)
        String internalNotes

) {
}