package com.fluxfund.api.domain.organization.mapper;

import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.domain.organization.dto.OrganizationResponse;

public class OrganizationMapper {

    private OrganizationMapper() {
    }

    public static OrganizationResponse toResponse(Organization organization) {
        return new OrganizationResponse(
                organization.getId(),
                organization.getName(),
                organization.isActive(),

                organization.getLegalName(),
                organization.getCnpj(),
                organization.getContactEmail(),
                organization.getContactPhone(),

                organization.getAddressLine(),
                organization.getAddressNumber(),
                organization.getAddressComplement(),
                organization.getNeighborhood(),
                organization.getCity(),
                organization.getState(),
                organization.getZipCode(),

                organization.getReviewerName(),
                organization.getReviewerTitle(),
                organization.getApproverName(),
                organization.getApproverTitle(),

                organization.getCreatedAt(),
                organization.getUpdatedAt());
    }
}
