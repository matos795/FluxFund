package com.fluxfund.api.domain.platform.organization.onboarding.service;

import java.time.OffsetDateTime;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.domain.organization.repository.OrganizationRepository;
import com.fluxfund.api.domain.platform.organization.onboarding.PlatformOrganizationOnboarding;
import com.fluxfund.api.domain.platform.organization.onboarding.PlatformOrganizationOnboardingMapper;
import com.fluxfund.api.domain.platform.organization.onboarding.PlatformOrganizationOnboardingRepository;
import com.fluxfund.api.domain.platform.organization.onboarding.PlatformOrganizationOnboardingStatus;
import com.fluxfund.api.domain.platform.organization.onboarding.dto.UpdatePlatformOrganizationOnboardingRequest;
import com.fluxfund.api.security.PlatformAccessService;
import com.fluxfund.api.shared.exception.BusinessException;
import com.fluxfund.api.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;


import java.time.LocalDate;
import java.util.stream.Collectors;

import com.fluxfund.api.domain.platform.organization.onboarding.dto.PlatformOrganizationOnboardingDetailsResponse;
import com.fluxfund.api.domain.platform.organization.onboarding.dto.PlatformOrganizationOnboardingReadinessResponse;

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

    private final
            PlatformOrganizationOnboardingReadinessService
            readinessService;

    public PlatformOrganizationOnboardingDetailsResponse
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

        return toDetails(
                organization,
                onboarding);
    }

    public PlatformOrganizationOnboardingDetailsResponse
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

        validateStatusRequirements(
                organization,
                onboarding,
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

        return toDetails(
                organization,
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

    private PlatformOrganizationOnboardingDetailsResponse
            toDetails(

                    Organization organization,

                    PlatformOrganizationOnboarding
                            onboarding) {

        return new PlatformOrganizationOnboardingDetailsResponse(
                PlatformOrganizationOnboardingMapper
                        .toResponse(
                                onboarding),

                readinessService.evaluate(
                        organization));
    }

    private void validateStatusRequirements(

            Organization organization,

            PlatformOrganizationOnboarding onboarding,

            UpdatePlatformOrganizationOnboardingRequest
                    request) {

        boolean preparingForLaunch =
                request.status()
                        == PlatformOrganizationOnboardingStatus
                                .READY_FOR_LAUNCH

                        || request.status()
                        == PlatformOrganizationOnboardingStatus
                                .LIVE;

        if (!preparingForLaunch) {
            return;
        }

        validateCommercialRequirements(
                request);

        validateManualRequirements(
                request);

        /*
         * READY_FOR_LAUNCH sempre reavalia os
         * requisitos automáticos.
         *
         * LIVE reavalia somente quando o cliente
         * está entrando em produção.
         *
         * Assim, um cliente já LIVE pode ser
         * temporariamente suspenso e ainda ter
         * suas observações internas atualizadas.
         */
        boolean mustValidateAutomaticReadiness =
                request.status()
                        == PlatformOrganizationOnboardingStatus
                                .READY_FOR_LAUNCH

                        || onboarding.getStatus()
                        != PlatformOrganizationOnboardingStatus
                                .LIVE;

        if (mustValidateAutomaticReadiness) {

            PlatformOrganizationOnboardingReadinessResponse
                    readiness =

                    readinessService.evaluate(
                            organization);

            if (!readiness.readyForLaunch()) {

                String pendingRequirements =
                        readiness
                                .requirements()
                                .stream()
                                .filter(
                                        requirement ->
                                                requirement.blocking()
                                                        && !requirement.completed())
                                .map(
                                        requirement ->
                                                requirement.title())
                                .collect(
                                        Collectors.joining(
                                                ", "));

                throw new BusinessException(
                        "Automatic onboarding requirements "
                                + "are pending: "
                                + pendingRequirements);
            }
        }

        if (request.status()
                == PlatformOrganizationOnboardingStatus
                        .LIVE) {

            if (!request.goLiveApproved()) {

                throw new BusinessException(
                        "Go-live approval is required "
                                + "before go live");
            }

            if (request
                    .contractStartDate()
                    .isAfter(
                            LocalDate.now())) {

                throw new BusinessException(
                        "Contract start date cannot be "
                                + "in the future when going live");
            }
        }
    }

    private void validateCommercialRequirements(
            UpdatePlatformOrganizationOnboardingRequest
                    request) {

        if (request.planName() == null
                || request.planName().isBlank()) {

            throw new BusinessException(
                    "Plan name is required before launch");
        }

        if (request.monthlyFee() == null) {

            throw new BusinessException(
                    "Monthly fee is required before launch");
        }

        if (request.contractStartDate() == null) {

            throw new BusinessException(
                    "Contract start date is required before launch");
        }

        if (request.billingDueDay() == null) {

            throw new BusinessException(
                    "Billing due day is required before launch");
        }
    }

    private void validateManualRequirements(
            UpdatePlatformOrganizationOnboardingRequest
                    request) {

        if (!request.contractSigned()
                || !request.categoriesReviewed()
                || !request.documentationRulesReviewed()
                || !request.initialImportValidated()
                || !request.testReportValidated()
                || !request.usersTrained()
                || !request.initialBackupConfirmed()) {

            throw new BusinessException(
                    "All onboarding preparation items "
                            + "must be completed before launch");
        }
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