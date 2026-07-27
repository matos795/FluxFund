package com.fluxfund.api.domain.platform.organization.onboarding;

import java.time.OffsetDateTime;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.domain.organization.repository.OrganizationRepository;
import com.fluxfund.api.domain.platform.organization.onboarding.dto.PlatformOrganizationOnboardingResponse;
import com.fluxfund.api.domain.platform.organization.onboarding.dto.UpdatePlatformOrganizationOnboardingRequest;
import com.fluxfund.api.security.PlatformAccessService;
import com.fluxfund.api.shared.exception.BusinessException;
import com.fluxfund.api.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class PlatformOrganizationOnboardingService {

    private final
            PlatformOrganizationOnboardingRepository
            repository;

    private final OrganizationRepository
            organizationRepository;

    private final PlatformAccessService
            platformAccessService;

    @Transactional(readOnly = true)
    public PlatformOrganizationOnboardingResponse
            findByOrganization(

                    UUID organizationId) {

        platformAccessService
                .requirePlatformAdmin();

        Organization organization =
                requireOrganization(
                        organizationId);

        PlatformOrganizationOnboarding
                onboarding =

                findOrCreate(
                        organization);

        return PlatformOrganizationOnboardingMapper
                .toResponse(
                        onboarding);
    }

    public PlatformOrganizationOnboardingResponse
            update(

                    UUID organizationId,

                    UpdatePlatformOrganizationOnboardingRequest
                            request) {

        platformAccessService
                .requirePlatformAdmin();

        Organization organization =
                requireOrganization(
                        organizationId);

        PlatformOrganizationOnboarding
                onboarding =

                findOrCreate(
                        organization);

        validateManualReadiness(
                request);

        onboarding.setStatus(
                request.status());

        onboarding.setPlanName(
                normalizeNullable(
                        request.planName()));

        onboarding.setMonthlyFee(
                request.monthlyFee());

        onboarding.setSetupFee(
                request.setupFee());

        onboarding.setContractStartDate(
                request.contractStartDate());

        onboarding.setBillingDueDay(
                request.billingDueDay());

        onboarding.setContractSigned(
                request.contractSigned());

        onboarding.setCategoriesReviewed(
                request.categoriesReviewed());

        onboarding.setDocumentationRulesReviewed(
                request
                        .documentationRulesReviewed());

        onboarding.setInitialImportValidated(
                request.initialImportValidated());

        onboarding.setTestReportValidated(
                request.testReportValidated());

        onboarding.setUsersTrained(
                request.usersTrained());

        onboarding.setInitialBackupConfirmed(
                request.initialBackupConfirmed());

        onboarding.setGoLiveApproved(
                request.goLiveApproved());

        onboarding.setInternalNotes(
                normalizeNullable(
                        request.internalNotes()));

        if (request.status()
                == PlatformOrganizationOnboardingStatus
                        .LIVE

                && onboarding.getLaunchedAt()
                == null) {

            onboarding.setLaunchedAt(
                    OffsetDateTime.now());
        }

        PlatformOrganizationOnboarding
                savedOnboarding =

                repository.save(
                        onboarding);

        return PlatformOrganizationOnboardingMapper
                .toResponse(
                        savedOnboarding);
    }

    public PlatformOrganizationOnboarding
            createForOrganization(

                    Organization organization) {

        return repository
                .findByOrganization_Id(
                        organization.getId())

                .orElseGet(
                        () -> {
                            PlatformOrganizationOnboarding
                                    onboarding =

                                    new PlatformOrganizationOnboarding();

                            onboarding.setOrganization(
                                    organization);

                            return repository.save(
                                    onboarding);
                        });
    }

    private PlatformOrganizationOnboarding
            findOrCreate(

                    Organization organization) {

        return repository
                .findByOrganization_Id(
                        organization.getId())

                .orElseGet(
                        () ->
                                createForOrganization(
                                        organization));
    }

    private void validateManualReadiness(
            UpdatePlatformOrganizationOnboardingRequest
                    request) {

        if (request.status()
                != PlatformOrganizationOnboardingStatus
                        .LIVE) {

            return;
        }

        if (request.planName() == null
                || request.planName().isBlank()) {

            throw new BusinessException(
                    "Plan name is required before go live");
        }

        if (request.monthlyFee() == null) {
            throw new BusinessException(
                    "Monthly fee is required before go live");
        }

        if (request.contractStartDate() == null) {
            throw new BusinessException(
                    "Contract start date is required before go live");
        }

        if (request.billingDueDay() == null) {
            throw new BusinessException(
                    "Billing due day is required before go live");
        }

        if (!request.contractSigned()
                || !request.categoriesReviewed()
                || !request.documentationRulesReviewed()
                || !request.initialImportValidated()
                || !request.testReportValidated()
                || !request.usersTrained()
                || !request.initialBackupConfirmed()
                || !request.goLiveApproved()) {

            throw new BusinessException(
                    "All manual onboarding items "
                            + "must be completed before go live");
        }
    }

    private Organization requireOrganization(
            UUID organizationId) {

        return organizationRepository
                .findById(
                        organizationId)

                .orElseThrow(
                        () ->
                                new ResourceNotFoundException(
                                        "Organization not found"));
    }

    private String normalizeNullable(
            String value) {

        if (value == null
                || value.isBlank()) {

            return null;
        }

        return value.trim();
    }
}