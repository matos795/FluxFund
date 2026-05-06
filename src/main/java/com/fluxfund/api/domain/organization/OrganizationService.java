package com.fluxfund.api.domain.organization;

import java.util.List;
import java.util.Objects;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fluxfund.api.domain.organization.dto.CreateOrganizationRequest;
import com.fluxfund.api.domain.organization.dto.OrganizationResponse;
import com.fluxfund.api.domain.organization.mapper.OrganizationMapper;
import com.fluxfund.api.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class OrganizationService {

    private final OrganizationRepository organizationRepository;

    public OrganizationResponse create(CreateOrganizationRequest request) {
        Organization organization = new Organization();
        organization.setName(request.name());

        Organization savedOrganization = organizationRepository.save(organization);

        return OrganizationMapper.toResponse(savedOrganization);
    }

    public List<OrganizationResponse> findAll() {
        return organizationRepository.findAll()
                .stream()
                .map(OrganizationMapper::toResponse)
                .toList();
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
}
