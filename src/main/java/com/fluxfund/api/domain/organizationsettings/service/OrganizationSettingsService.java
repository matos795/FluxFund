package com.fluxfund.api.domain.organizationsettings.service;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fluxfund.api.domain.fund.Fund;
import com.fluxfund.api.domain.fund.repository.FundRepository;
import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.domain.organization.OrganizationRepository;
import com.fluxfund.api.domain.organizationsettings.OrganizationSettings;
import com.fluxfund.api.domain.organizationsettings.dto.OrganizationSettingsResponse;
import com.fluxfund.api.domain.organizationsettings.dto.UpdateOrganizationSettingsRequest;
import com.fluxfund.api.domain.organizationsettings.mapper.OrganizationSettingsMapper;
import com.fluxfund.api.domain.organizationsettings.repository.OrganizationSettingsRepository;
import com.fluxfund.api.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class OrganizationSettingsService {

    private final OrganizationRepository organizationRepository;
    private final OrganizationSettingsRepository repository;
    private final FundRepository fundRepository;

    @Transactional(readOnly = true)
    public OrganizationSettingsResponse findByOrganization(UUID organizationId) {
        OrganizationSettings settings = findOrCreateSettings(organizationId);

        return OrganizationSettingsMapper.toResponse(settings);
    }

    public OrganizationSettingsResponse update(UUID organizationId, UpdateOrganizationSettingsRequest request) {
        OrganizationSettings settings = findOrCreateSettings(organizationId);

        Fund defaultFund = null;

        if (request.defaultFundId() != null) {
            defaultFund = fundRepository.findByIdAndOrganizationIdAndActiveTrue(request.defaultFundId(), organizationId)
            .orElseThrow(() -> new ResourceNotFoundException("Default fund not found"));
        }

        settings.setDefaultFund(defaultFund);

        repository.save(settings);

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
