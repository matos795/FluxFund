package com.fluxfund.api.domain.organizationsettings.service;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fluxfund.api.domain.audit.AuditAction;
import com.fluxfund.api.domain.audit.AuditEntityType;
import com.fluxfund.api.domain.audit.service.AuditLogService;
import com.fluxfund.api.domain.fund.Fund;
import com.fluxfund.api.domain.fund.repository.FundRepository;
import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.domain.organization.OrganizationRepository;
import com.fluxfund.api.domain.organizationsettings.OrganizationSettings;
import com.fluxfund.api.domain.organizationsettings.dto.OrganizationSettingsResponse;
import com.fluxfund.api.domain.organizationsettings.dto.UpdateOrganizationSettingsRequest;
import com.fluxfund.api.domain.organizationsettings.mapper.OrganizationSettingsMapper;
import com.fluxfund.api.domain.organizationsettings.repository.OrganizationSettingsRepository;
import com.fluxfund.api.security.OrganizationAccessService;
import com.fluxfund.api.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class OrganizationSettingsService {

    private final OrganizationRepository organizationRepository;
    private final OrganizationSettingsRepository repository;
    private final FundRepository fundRepository;
    private final OrganizationAccessService organizationAccessService;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public OrganizationSettingsResponse findByOrganization(UUID organizationId) {
        organizationAccessService.requireReadAccess(organizationId);

        OrganizationSettings settings = findOrCreateSettings(organizationId);

        return OrganizationSettingsMapper.toResponse(settings);
    }

    public OrganizationSettingsResponse update(UUID organizationId, UpdateOrganizationSettingsRequest request) {
        organizationAccessService.requireAdminAccess(organizationId);

        OrganizationSettings settings = findOrCreateSettings(organizationId);

        Fund defaultFund = null;

        if (request.defaultFundId() != null) {
            defaultFund = fundRepository.findByIdAndOrganizationIdAndActiveTrue(
                    request.defaultFundId(),
                    organizationId)
                    .orElseThrow(() -> new ResourceNotFoundException("Default fund not found"));
        }

        settings.setDefaultFund(defaultFund);

        if (request.allowNegativeFunds() != null) {
            settings.setAllowNegativeFunds(request.allowNegativeFunds());
        }

        if (request.suggestDefaultFundReallocation() != null) {
            settings.setSuggestDefaultFundReallocation(
                    request.suggestDefaultFundReallocation());
        }

        if (settings.isAllowNegativeFunds()) {
            settings.setSuggestDefaultFundReallocation(false);
        }

        if (settings.getDefaultFund() == null) {
            settings.setSuggestDefaultFundReallocation(false);
        }

        if (request.requireFiscalDocumentForExpenses() != null) {
            settings.setRequireFiscalDocumentForExpenses(
                    request.requireFiscalDocumentForExpenses());
        }

        if (request.requireProofForIncomes() != null) {
            settings.setRequireProofForIncomes(
                    request.requireProofForIncomes());
        }

        if (request.autoFillClassificationSuggestions() != null) {
            settings.setAutoFillClassificationSuggestions(
                    request.autoFillClassificationSuggestions());
        }

        repository.save(settings);

        auditLogService.record(
                organizationId,
                AuditEntityType.ORGANIZATION_SETTINGS,
                settings.getId(),
                AuditAction.CHANGE_DEFAULT_FUND,
                defaultFund != null
                        ? "Organization settings updated. Default fund: " + defaultFund.getId()
                        : "Organization settings updated. Default fund removed");

        return OrganizationSettingsMapper.toResponse(settings);
    }

    public OrganizationSettings findOrCreateSettings(UUID organizationId) {
        return repository.findByOrganizationId(organizationId)
                .orElseGet(() -> createDefaultSettings(organizationId));
    }

    private OrganizationSettings createDefaultSettings(UUID organizationId) {
        Organization organization = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        OrganizationSettings settings = new OrganizationSettings();
        settings.setOrganization(organization);

        return repository.save(settings);
    }
}
