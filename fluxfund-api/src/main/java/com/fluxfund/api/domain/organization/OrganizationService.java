package com.fluxfund.api.domain.organization;

import java.util.Objects;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fluxfund.api.domain.organization.dto.CreateOrganizationRequest;
import com.fluxfund.api.domain.organization.dto.OrganizationResponse;
import com.fluxfund.api.domain.organization.dto.UpdateOrganizationProfileRequest;
import com.fluxfund.api.domain.organization.mapper.OrganizationMapper;
import com.fluxfund.api.security.OrganizationAccessService;
import com.fluxfund.api.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class OrganizationService {

    private final OrganizationRepository organizationRepository;
    private final OrganizationAccessService organizationAccessService;

    public OrganizationResponse create(CreateOrganizationRequest request) {
        Organization organization = new Organization();
        organization.setName(request.name());

        Organization savedOrganization = organizationRepository.save(organization);

        return OrganizationMapper.toResponse(savedOrganization);
    }

    public Page<OrganizationResponse> findAll(Pageable pageable) {
        Objects.requireNonNull(pageable, "pageable must not be null");
        return organizationRepository.findAll(pageable)
                .map(OrganizationMapper::toResponse);
    }

    public OrganizationResponse findById(UUID id) {
        Objects.requireNonNull(id, "id must not be null");
        Organization organization = organizationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        return OrganizationMapper.toResponse(organization);
    }

    public OrganizationResponse update(UUID id, CreateOrganizationRequest request) {
        Objects.requireNonNull(id, "id must not be null");
        Organization organization = organizationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        organization.setName(request.name());

        Organization updatedOrganization = organizationRepository.save(organization);

        return OrganizationMapper.toResponse(updatedOrganization);
    }

    public void delete(UUID id) {
        Objects.requireNonNull(id, "id must not be null");
        if (!organizationRepository.existsById(id)) {
            throw new ResourceNotFoundException("Organization not found");
        }

        organizationRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public OrganizationResponse findCurrent(UUID organizationId) {
        organizationAccessService.requireReadAccess(organizationId);

        Organization organization = organizationRepository
                .findByIdAndActiveTrue(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        return OrganizationMapper.toResponse(organization);
    }

    public OrganizationResponse updateCurrent(
            UUID organizationId,
            UpdateOrganizationProfileRequest request) {

        organizationAccessService.requireAdminAccess(organizationId);

        Organization organization = organizationRepository
                .findByIdAndActiveTrue(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        organization.setName(request.name().trim());

        return OrganizationMapper.toResponse(
                organizationRepository.save(organization));
    }
}
